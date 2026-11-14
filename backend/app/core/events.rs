use tokio::sync::broadcast;

use crate::core::schemas::{InternalEvent, TransactionResponse};

#[derive(Clone)]
pub struct EventHub {
    tx: broadcast::Sender<InternalEvent>,
}

impl Default for EventHub {
    fn default() -> Self {
        Self::new(512)
    }
}

impl EventHub {
    pub fn new(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { tx }
    }

    pub fn broadcast(&self, event: InternalEvent) {
        let _ = self.tx.send(event);
    }

    pub fn broadcast_txn_update(&self, txn: &TransactionResponse) {
        if let Ok(payload) = serde_json::to_value(txn) {
            let event = InternalEvent {
                event_type: "txn.updated".to_string(),
                payload,
                timestamp: chrono::Utc::now(),
            };
            self.broadcast(event);
        }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<InternalEvent> {
        self.tx.subscribe()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_event_hub_broadcast() {
        let hub = EventHub::new(16);
        let mut rx = hub.subscribe();

        let event = InternalEvent {
            event_type: "ai.advice".to_string(),
            payload: json!({ "tip": "Suspicious pattern" }),
            timestamp: chrono::Utc::now(),
        };

        hub.broadcast(event);

        let received = rx.recv().await.unwrap();
        assert_eq!(received.event_type, "ai.advice");
        assert_eq!(received.payload["tip"], "Suspicious pattern");
    }
}
