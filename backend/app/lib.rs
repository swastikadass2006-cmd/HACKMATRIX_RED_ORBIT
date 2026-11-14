pub mod api;
pub mod core;

pub fn health_status() -> &'static str {
    "ok"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_status() {
        assert_eq!(health_status(), "ok");
    }
}
