import hashlib
import json
import math
import re
from difflib import SequenceMatcher
from functools import lru_cache

PROTECTED_BRANDS = (
    "sbi", "hdfcbank", "icicibank", "axisbank", "kotak", "paytm",
    "phonepe", "gpay", "npci", "bhim", "rbi", "pmcares", "irctc"
)

HOMOGLYPH_MAP = str.maketrans({
    "0": "o",
    "1": "l",
    "!": "i",
    "$": "s",
    "5": "s",
    "8": "b",
})

SCAM_LURE_PATTERNS = re.compile(
    r"\b(kyc\s*expired|account\s*blocked|electricity\s*bill|customs\s*parcel|"
    r"digital\s*arrest|pan\s*update|share\s*otp|instant\s*refund|lottery\s*winner)\b",
    re.IGNORECASE,
)

TRUSTLENS_RISK_CLASSES = (
    "Safe-looking",
    "Suspicious",
    "High Risk",
    "Confirmed Malicious",
    "Inconclusive",
)


def compute_shannon_entropy(text: str) -> float:
    """Computes Shannon entropy (bits per character) to flag random burner/mule VPAs."""
    if not text:
        return 0.0
    length = len(text)
    freqs = {}
    for ch in text:
        freqs[ch] = freqs.get(ch, 0) + 1
    return -sum((count / length) * math.log2(count / length) for count in freqs.values())


def detect_typosquat_or_homograph(vpa: str) -> tuple[bool, str | None]:
    """
    Applies TrustLens hyphen-stripped substring matching, homoglyph normalization,
    and string similarity metrics against protected financial/government brands.
    """
    handle = vpa.lower().split("@")[0]
    stripped = re.sub(r"[\-._]", "", handle)
    normalized = stripped.translate(HOMOGLYPH_MAP).replace("rn", "m")

    for brand in PROTECTED_BRANDS:
        if stripped == brand and handle == brand:
            continue

        if normalized == brand and stripped != brand:
            return True, brand

        if brand in normalized and normalized != brand:
            return True, brand

        if abs(len(normalized) - len(brand)) <= 2 and len(normalized) >= 4:
            ratio = SequenceMatcher(None, normalized, brand).ratio()
            if 0.80 <= ratio < 1.0:
                return True, brand

    return False, None


@lru_cache(maxsize=4096)
def analyze_vpa_lexical_signals(vpa: str) -> dict:
    """Runs TrustLens lexical + entropy + typosquat analysis on a UPI VPA handle."""
    handle = vpa.lower().split("@")[0]
    entropy = compute_shannon_entropy(handle)
    digit_ratio = sum(c.isdigit() for c in handle) / max(len(handle), 1)

    is_high_entropy_burner = len(handle) >= 9 and entropy >= 3.45 and digit_ratio >= 0.25
    is_typosquat, target_brand = detect_typosquat_or_homograph(vpa)

    return {
        "shannon_entropy": round(entropy, 3),
        "is_high_entropy_burner": is_high_entropy_burner,
        "is_typosquat": is_typosquat,
        "target_brand": target_brand,
    }


def classify_trustlens_risk_fusion(
    score: int,
    ml_prob: float,
    is_typosquat: bool = False,
    screen_share_detected: bool = False,
) -> str:
    """
    TrustLens Discrete Risk Fusion: Synthesizes multi-engine signals into a unified
    five-class risk framework: Safe-looking, Suspicious, High Risk, Confirmed Malicious, Inconclusive.
    """
    if score < 0 or not (0.0 <= ml_prob <= 1.0):
        return "Inconclusive"
    if score >= 80 or (is_typosquat and ml_prob >= 0.75) or (screen_share_detected and score >= 75):
        return "Confirmed Malicious"
    if score >= 55 or ml_prob >= 0.65 or is_typosquat:
        return "High Risk"
    if score >= 25 or ml_prob >= 0.35:
        return "Suspicious"
    return "Safe-looking"


def generate_web3_threat_hash(
    txn_id: str,
    sender_vpa: str,
    receiver_vpa: str,
    score: int,
    decision: str,
    reason_codes: list[str],
) -> str:
    """
    TrustLens Web3 Verification: Canonicalizes the final threat verdict JSON
    and produces a tamper-proof SHA-256 hex digest ready for on-chain anchoring.
    """
    canonical_payload = json.dumps(
        {
            "decision": decision,
            "reasons": sorted(reason_codes),
            "receiver_vpa": receiver_vpa.lower(),
            "score": score,
            "sender_vpa": sender_vpa.lower(),
            "txn_id": txn_id,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    digest = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()
    return f"0x{digest[:16]}"
