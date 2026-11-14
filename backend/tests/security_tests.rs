use shieldpay_core::core::security::{
    compute_hmac_sha256, hash_salted_otp, verify_signature, OtpManager, SecurityError,
};
use std::env;
use uuid::Uuid;

#[test]
fn test_hmac_signature_verification() {
    let raw_body = br#"{"txn_id":"test-123","amount":500.0}"#;
    let secret = "dev-secret-key";
    let valid_signature = compute_hmac_sha256(secret.as_bytes(), raw_body);

    // 1. Valid signature
    assert!(verify_signature(Some(&valid_signature), raw_body).is_ok());

    // 2. Tampered raw body
    let tampered_body = br#"{"txn_id":"test-123","amount":9999.0}"#;
    assert_eq!(
        verify_signature(Some(&valid_signature), tampered_body),
        Err(SecurityError::InvalidSignature)
    );

    // 3. Bad signature
    assert_eq!(
        verify_signature(Some("deadbeef1234"), raw_body),
        Err(SecurityError::InvalidSignature)
    );

    // 4. Missing signature
    assert_eq!(
        verify_signature(None, raw_body),
        Err(SecurityError::MissingSignature)
    );
}

#[test]
fn test_hmac_bypass_env_flag() {
    let raw_body = br#"{"test":true}"#;
    env::set_var("DISABLE_HMAC", "true");
    assert!(verify_signature(None, raw_body).is_ok());
    assert!(verify_signature(Some("invalid"), raw_body).is_ok());
    env::remove_var("DISABLE_HMAC");
}

#[test]
fn test_salted_otp_manager_success_and_invalidation() {
    let otp_manager = OtpManager::new();
    let txn_id = Uuid::new_v4();

    let otp = otp_manager.generate_otp(txn_id);
    assert_eq!(otp.len(), 6);
    assert!(otp.chars().all(|c| c.is_ascii_digit()));

    // Wrong OTP must fail
    assert!(!otp_manager.verify_otp(txn_id, "000000"));

    // Correct OTP must succeed
    assert!(otp_manager.verify_otp(txn_id, &otp));

    // Replay/Single-use: Cannot be used again
    assert!(!otp_manager.verify_otp(txn_id, &otp));
}

#[test]
fn test_salted_otp_manager_ttl_expiry() {
    let otp_manager = OtpManager::new();
    let txn_id = Uuid::new_v4();

    // Generate an OTP with a negative TTL (already expired)
    let otp = otp_manager.generate_otp_with_ttl(txn_id, -1);

    // Attempting to verify expired OTP must fail
    assert!(!otp_manager.verify_otp(txn_id, &otp));
}

#[test]
fn test_salted_otp_hash_determinism() {
    let salt = "abcdef1234567890";
    let otp = "654321";
    let hash1 = hash_salted_otp(salt, otp);
    let hash2 = hash_salted_otp(salt, otp);
    assert_eq!(hash1, hash2);

    let hash_diff = hash_salted_otp("different_salt", otp);
    assert_ne!(hash1, hash_diff);
}
