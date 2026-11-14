use hex;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::env;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, PartialEq, Eq)]
pub enum SecurityError {
    MissingSignature,
    InvalidSignature,
}

impl std::fmt::Display for SecurityError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SecurityError::MissingSignature => write!(f, "Missing X-Signature header"),
            SecurityError::InvalidSignature => write!(f, "Invalid HMAC signature"),
        }
    }
}

impl std::error::Error for SecurityError {}

pub fn get_hmac_secret() -> String {
    env::var("HMAC_SECRET").unwrap_or_else(|_| "dev-secret-key".to_string())
}

pub fn is_hmac_disabled() -> bool {
    env::var("DISABLE_HMAC")
        .map(|v| v.eq_ignore_ascii_case("true"))
        .unwrap_or(false)
}

pub fn compute_hmac_sha256(secret: &[u8], data: &[u8]) -> String {
    let mut mac = HmacSha256::new_from_slice(secret)
        .expect("HMAC can take key of any size");
    mac.update(data);
    let result = mac.finalize();
    hex::encode(result.into_bytes())
}

pub fn verify_signature(signature: Option<&str>, raw_body: &[u8]) -> Result<(), SecurityError> {
    if is_hmac_disabled() {
        return Ok(());
    }

    let signature = signature.ok_or(SecurityError::MissingSignature)?.trim();
    let secret = get_hmac_secret();
    let expected = compute_hmac_sha256(secret.as_bytes(), raw_body);

    if signature.eq_ignore_ascii_case(&expected) {
        Ok(())
    } else {
        Err(SecurityError::InvalidSignature)
    }
}
