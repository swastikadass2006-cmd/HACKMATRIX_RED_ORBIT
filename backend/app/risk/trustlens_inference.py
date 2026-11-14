import logging
import math
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from pathlib import Path
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ============================================================================
# TRUSTLENS ML INFERENCE WRAPPER FOR SHIELDPAY
# Extracted from TrustLens models/predict.py & advanced_threat_engine.py
# ============================================================================

FEATURE_NAMES = [
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

IP_REGEX = re.compile(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$")
SUSP_TLDS = (".xyz", ".top", ".tk", ".club", ".work")

# Trusted registered domains allowlist (from advanced_threat_engine.py)
ALLOWLIST_DOMAINS = {
    "google.com",
    "microsoft.com",
    "amazon.com",
    "apple.com",
    "paypal.com",
    "facebook.com",
    "instagram.com",
    "netflix.com",
    "wikipedia.org",
    "github.com",
    "python.org",
    "adamasuniversity.ac.in",
    "npci.org.in",
    "sbi.co.in",
    "hdfcbank.com",
    "icicibank.com",
    "axisbank.com",
    "kotak.com",
    "paytm.com",
    "phonepe.com",
}

# Protected brands watchlist (from advanced_threat_engine.py)
BRAND_WATCHLIST = {
    "sbi", "onlinesbi", "hdfc", "icici", "axisbank",
    "pnb", "pnbindia", "bob", "bankofbaroda", "kotak",
    "paytm", "phonepe", "gpay", "googlepay", "bhim",
    "upi", "npci", "irctc", "digilocker", "uidai",
    "incometax", "incometaxindia", "indiapost",
    "paypal", "google", "amazon", "apple",
}

# Module-level model state (Loaded once at startup, reused per-request)
_MODEL = None
_MODEL_LOADED = False
_LOAD_LOCK = threading.Lock()

# Persistent bounded thread pool for 20ms timeout enforcement
_INFERENCE_EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="trustlens-inference")

# In-memory LRU cache for repeat receiver evaluations (<0.002ms)
_CACHE: dict[str, dict] = {}
_CACHE_LOCK = threading.Lock()
_MAX_CACHE_SIZE = 4096


def shannon_entropy(s: str) -> float:
    """Computes Shannon entropy of string in bits per character."""
    if not s:
        return 0.0
    length = len(s)
    freqs = {}
    for ch in s:
        freqs[ch] = freqs.get(ch, 0) + 1
    return -sum((count / length) * math.log2(count / length) for count in freqs.values())


def normalize_target(target: str) -> str:
    """
    Adapts a transaction's receiver_vpa or URL into a canonical URL string
    compatible with the TrustLens feature extraction pipeline.
    """
    target = str(target or "").strip()
    if not target:
        return "https://unknown.local"

    # Full HTTP/HTTPS URL
    if target.lower().startswith(("http://", "https://")):
        return target

    # UPI URI (upi://pay?pa=...)
    if target.lower().startswith("upi://"):
        return target

    # UPI VPA format: handle@bank
    if "@" in target:
        parts = target.split("@", 1)
        handle, psp = parts[0], parts[1]
        # Format as hostname so TLD and brand/hyphen features can be analyzed
        return f"https://{handle}.{psp}"

    # Plain domain or hostname
    return f"https://{target}"


def extract_url_vector(url: str) -> list[float]:
    """
    Extracts the exact 26-feature vector expected by url_xgboost.joblib.
    100% pure Python with zero network I/O.
    """
    url = str(url).strip()
    parsed = urlparse(url)

    h = (parsed.hostname or "").lower()
    p = parsed.path or ""
    u = url.lower()
    ul = len(url)

    return [
        float(ul),
        float(len(h)),
        float(len(p)),
        float(shannon_entropy(url)),
        float(shannon_entropy(h)),
        float(url.count(".")),
        float(url.count("-")),
        float(url.count("@")),
        float(url.count("?")),
        float(url.count("=")),
        float(url.count("//")),
        1.0 if parsed.scheme == "https" else 0.0,
        1.0 if IP_REGEX.match(h) else 0.0,
        float(h.count(".")),
        float(sum(c.isdigit() for c in url) / (ul + 1)),
        float(sum(c.isalpha() for c in url) / (ul + 1)),
        1.0 if "xn--" in h else 0.0,
        1.0 if any(t in h for t in SUSP_TLDS) else 0.0,
        float(url.count("/")),
        1.0 if "//" in p else 0.0,
        float(len(parsed.query)),
        float(sum(c.isdigit() for c in h)),
        1.0 if "-" in h else 0.0,
        1.0 if ("login" in u or "signin" in u) else 0.0,
        1.0 if ("verify" in u or "secure" in u) else 0.0,
        1.0 if ("bank" in u or "update" in u) else 0.0,
    ]


def _find_model_path() -> Path | None:
    """Resolves path to url_xgboost.joblib across development and container layouts."""
    env_path = os.environ.get("TRUSTLENS_MODEL_PATH")
    if env_path and Path(env_path).exists():
        return Path(env_path)

    candidates = [
        Path(__file__).resolve().parent / "artifacts" / "url_xgboost.joblib",
        Path(__file__).resolve().parents[3] / "models" / "url_xgboost.joblib",
        Path.cwd() / "models" / "url_xgboost.joblib",
        Path("/app/models/url_xgboost.joblib"),
        Path("/app/app/risk/artifacts/url_xgboost.joblib"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def load_trustlens_model(path: Path | str | None = None) -> bool:
    """
    Efficient startup loader: loads the pre-trained XGBoost .joblib model
    into memory ONCE. It is NOT loaded per-request.
    """
    global _MODEL, _MODEL_LOADED
    if _MODEL_LOADED:
        return _MODEL is not None

    with _LOAD_LOCK:
        if _MODEL_LOADED:
            return _MODEL is not None

        model_path = Path(path) if path else _find_model_path()
        if not model_path or not model_path.exists():
            logger.warning(
                "TrustLens XGBoost model not found at candidate locations. "
                "Operating with lexical threat engine."
            )
            _MODEL_LOADED = True
            return False

        try:
            import joblib
            loaded = joblib.load(model_path)
            expected_feats = len(FEATURE_NAMES)
            if hasattr(loaded, "n_features_in_") and loaded.n_features_in_ != expected_feats:
                logger.warning(
                    "TrustLens model feature count mismatch: expected %d, got %d",
                    expected_feats,
                    loaded.n_features_in_,
                )
            _MODEL = loaded
            _MODEL_LOADED = True
            logger.info("TrustLens XGBoost model loaded successfully from %s", model_path)
            return True
        except Exception as exc:
            logger.warning(
                "Failed to load TrustLens model from %s: %s. Operating in resilient fallback mode.",
                model_path,
                exc,
            )
            _MODEL_LOADED = True
            return False


def is_model_loaded() -> bool:
    """Returns True if the XGBoost model is loaded in memory."""
    return _MODEL is not None


def _execute_raw_inference(target: str, threshold: float = 0.65) -> dict:
    """Internal core inference logic running in pure memory."""
    normalized = normalize_target(target)
    parsed = urlparse(normalized)
    hostname = (parsed.hostname or "").lower()

    # 1. Allowlist check: Known trusted domains are immediately benign
    for domain in ALLOWLIST_DOMAINS:
        if hostname == domain or hostname.endswith("." + domain):
            return {
                "flagged": False,
                "probability": 0.0,
                "target": normalized,
                "reason": "ALLOWLISTED",
            }

    # Standard clean UPI handles on trusted bank PSPs are benign
    if "@" in target:
        parts = target.split("@", 1)
        h_part, psp_part = parts[0].lower(), parts[1].lower()
        legit_psps = {"ybl", "okaxis", "okhdfc", "okicici", "oksbi", "paytm", "ibl", "axl", "upi", "apl"}
        phishing_tokens = ("login", "verify", "secure", "signin", "kyc", "update", "bank", "support", "helpdesk")
        is_clean_handle = not any(tok in h_part for tok in phishing_tokens) and not any(tld in h_part for tld in SUSP_TLDS) and "-" not in h_part
        if psp_part in legit_psps and is_clean_handle:
            return {
                "flagged": False,
                "probability": 0.05,
                "target": normalized,
                "reason": "LEGIT_UPI_PSP",
            }

    # 2. Extract 26-element URL feature vector
    vec = extract_url_vector(normalized)

    # 3. XGBoost Model Prediction if loaded
    if _MODEL is not None:
        try:
            import numpy as np
            X = np.asarray([vec], dtype=np.float32)
            probabilities = _MODEL.predict_proba(X)[0]
            classes = list(getattr(_MODEL, "classes_", [0, 1]))
            malicious_index = classes.index(1) if 1 in classes else -1

            if malicious_index != -1:
                mal_prob = float(probabilities[malicious_index])
            else:
                mal_prob = float(probabilities[-1])

            is_malicious = mal_prob >= threshold
            return {
                "flagged": is_malicious,
                "probability": round(mal_prob, 4),
                "target": normalized,
                "reason": "ML_ANOMALY" if is_malicious else "BENIGN",
            }
        except Exception as exc:
            logger.debug("XGBoost prediction failed: %s, checking threat heuristics", exc)

    # 4. Resilient Fallback Threat Engine (if model binary is unavailable)
    has_suspicious_tld = vec[17] > 0
    has_keywords = (vec[23] + vec[24] + vec[25]) > 0
    is_ip = vec[12] > 0
    entropy = vec[3]
    has_hyphen = vec[22] > 0

    flagged = (
        (has_suspicious_tld and (has_keywords or has_hyphen))
        or (is_ip and has_keywords)
        or (entropy >= 4.15 and (has_keywords or has_suspicious_tld))
    )
    prob = 0.82 if flagged else 0.08
    return {
        "flagged": flagged,
        "probability": prob,
        "target": normalized,
        "reason": "THREAT_HEURISTIC" if flagged else "BENIGN",
    }


def predict_transaction(
    target: str,
    timeout_ms: float = 20.0,
    threshold: float = 0.65,
) -> dict | None:
    """
    Lightweight inference wrapper with STRICT GUARDRAILS:
    - 20ms timeout via bounded thread pool.
    - Wrapped in strict try/except block.
    - Caches results by target for sub-millisecond repeated queries.
    - Returns dict with 'flagged': bool and 'probability': float, or None on error/timeout.
    """
    if not _MODEL_LOADED:
        load_trustlens_model()

    target_key = str(target or "").strip()

    # Fast in-memory cache lookup (<0.001ms)
    with _CACHE_LOCK:
        if target_key in _CACHE:
            return _CACHE[target_key]

    timeout_sec = max(0.001, timeout_ms / 1000.0)

    try:
        future = _INFERENCE_EXECUTOR.submit(_execute_raw_inference, target_key, threshold)
        result = future.result(timeout=timeout_sec)

        with _CACHE_LOCK:
            if len(_CACHE) >= _MAX_CACHE_SIZE:
                _CACHE.clear()
            _CACHE[target_key] = result

        return result
    except TimeoutError:
        logger.warning(
            "TrustLens ML inference timed out after %.1fms for target '%s'. Falling back gracefully.",
            timeout_ms,
            target_key,
        )
        return None
    except Exception as exc:
        logger.warning(
            "TrustLens ML inference error for target '%s': %s. Falling back gracefully.",
            target_key,
            exc,
        )
        return None


# Auto-load model at module import time
try:
    load_trustlens_model()
except Exception:
    pass
