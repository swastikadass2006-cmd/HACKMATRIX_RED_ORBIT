/// Masks a UPI Virtual Payment Address (VPA) for security and privacy.
/// Example: `rahul@okaxis` -> `rah***@okaxis`.
/// Local usernames with 3 or fewer characters retain up to 3 chars followed by `***`.
pub fn mask_vpa(vpa: &str) -> String {
    let parts: Vec<&str> = vpa.split('@').collect();
    if parts.len() == 2 {
        let username = parts[0];
        let handle = parts[1];
        let visible_len = if username.len() <= 3 {
            username.len().min(3)
        } else {
            3
        };
        let visible = &username[..visible_len];
        format!("{}***@{}", visible, handle)
    } else {
        if vpa.len() > 3 {
            format!("{}***", &vpa[..3])
        } else {
            format!("{}***", vpa)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mask_vpa_standard() {
        assert_eq!(mask_vpa("rahul@okaxis"), "rah***@okaxis");
        assert_eq!(mask_vpa("shop@ybl"), "sho***@ybl");
    }

    #[test]
    fn test_mask_vpa_short_username() {
        assert_eq!(mask_vpa("ab@upi"), "ab***@upi");
        assert_eq!(mask_vpa("a@upi"), "a***@upi");
        assert_eq!(mask_vpa("raj@icici"), "raj***@icici");
    }

    #[test]
    fn test_mask_vpa_no_handle() {
        assert_eq!(mask_vpa("invalidvpa"), "inv***");
        assert_eq!(mask_vpa("ab"), "ab***");
    }
}
