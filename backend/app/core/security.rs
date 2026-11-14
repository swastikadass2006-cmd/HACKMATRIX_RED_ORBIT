use chrono::{DateTime, Duration, Utc};
use hex;
use hmac::{Hmac, Mac};
use rand::Rng;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, RwLock};
use uuid::Uuid;

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

pub fn hash_salted_otp(salt: &str, otp: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(otp.as_bytes());
    hex::encode(hasher.finalize())
}

#[derive(Debug, Clone)]
pub struct OtpRecord {
    pub salt: String,
    pub hashed_otp: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Default)]
pub struct OtpManager {
    otps: Arc<RwLock<HashMap<Uuid, OtpRecord>>>,
}

impl OtpManager {
    pub fn new() -> Self {
        Self {
            otps: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Generates a 6-digit numeric OTP in memory, stores ONLY SHA-256(salt + otp) with a 120s TTL.
    /// Returns the raw OTP for demonstration/delivery.
    pub fn generate_otp(&self, txn_id: Uuid) -> String {
        let mut rng = rand::thread_rng();
        let otp_num: u32 = rng.gen_range(100_000..=999_999);
        let otp_str = otp_num.to_string();

        let salt_bytes: [u8; 16] = rng.gen();
        let salt = hex::encode(salt_bytes);
        let hashed_otp = hash_salted_otp(&salt, &otp_str);
        let expires_at = Utc::now() + Duration::seconds(120);

        if let Ok(mut lock) = self.otps.write() {
            lock.insert(
                txn_id,
                OtpRecord {
                    salt,
                    hashed_otp,
                    expires_at,
                },
            );
        }

        otp_str
    }

    /// Explicitly store an OTP with a custom TTL for testing expiry.
    pub fn generate_otp_with_ttl(&self, txn_id: Uuid, ttl_seconds: i64) -> String {
        let mut rng = rand::thread_rng();
        let otp_num: u32 = rng.gen_range(100_000..=999_999);
        let otp_str = otp_num.to_string();

        let salt_bytes: [u8; 16] = rng.gen();
        let salt = hex::encode(salt_bytes);
        let hashed_otp = hash_salted_otp(&salt, &otp_str);
        let expires_at = Utc::now() + Duration::seconds(ttl_seconds);

        if let Ok(mut lock) = self.otps.write() {
            lock.insert(
                txn_id,
                OtpRecord {
                    salt,
                    hashed_otp,
                    expires_at,
                },
            );
        }

        otp_str
    }

    /// Verifies the OTP. Returns true on valid match before TTL, false otherwise.
    /// Upon successful verification, the OTP is invalidated.
    pub fn verify_otp(&self, txn_id: Uuid, input_otp: &str) -> bool {
        let record = {
            if let Ok(lock) = self.otps.read() {
                lock.get(&txn_id).cloned()
            } else {
                None
            }
        };

        if let Some(record) = record {
            let now = Utc::now();
            if now > record.expires_at {
                // Expired - clean it up
                if let Ok(mut lock) = self.otps.write() {
                    lock.remove(&txn_id);
                }
                return false;
            }

            let computed_hash = hash_salted_otp(&record.salt, input_otp.trim());
            if computed_hash == record.hashed_otp {
                if let Ok(mut lock) = self.otps.write() {
                    lock.remove(&txn_id);
                }
                true
            } else {
                false
            }
        } else {
            false
        }
    }
}
