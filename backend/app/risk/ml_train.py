import csv
import random
from pathlib import Path
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, f1_score, classification_report
from sklearn.model_selection import train_test_split

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "fraud_model.joblib"
CSV_PATH = ARTIFACT_DIR / "upi_synthetic_training.csv"

FEATURE_NAMES = [
    "velocity_1m",
    "velocity_10m",
    "micro_split_count",
    "amount_ratio",
    "is_new_payee",
    "is_new_device",
    "is_geo_mismatch",
    "is_on_active_call",
    "screen_share_detected",
    "vpa_pasted_from_clipboard",
    "is_fan_in",
    "is_hop_chain",
]

def generate_synthetic_dataset(n_samples: int = 3000) -> tuple[list[list[float]], list[int]]:
    random.seed(42)
    X, y = [], []

    for _ in range(n_samples):
        is_fraud = 1 if random.random() < 0.12 else 0  # Imbalanced: 88% legit, 12% fraud

        if not is_fraud:
            row = [
                random.choices([0, 1, 2], weights=[0.85, 0.12, 0.03])[0],  # velocity_1m
                random.randint(0, 4),                                      # velocity_10m
                0,                                                         # micro_split_count
                round(random.uniform(0.2, 2.2), 2),                        # amount_ratio
                1 if random.random() < 0.15 else 0,                        # is_new_payee
                1 if random.random() < 0.04 else 0,                        # is_new_device
                1 if random.random() < 0.05 else 0,                        # is_geo_mismatch
                1 if random.random() < 0.03 else 0,                        # is_on_active_call
                0,                                                         # screen_share_detected
                1 if random.random() < 0.08 else 0,                        # vpa_pasted_from_clipboard
                0,                                                         # is_fan_in
                0,                                                         # is_hop_chain
            ]
        else:
            attack_type = random.choice(["coercion", "micro_split", "takeover", "mule"])
            if attack_type == "coercion":
                row = [0, 1, 0, round(random.uniform(3.5, 12.0), 2), 1, 0, 0, 1, random.choice([0, 1]), 1, 0, 0]
            elif attack_type == "micro_split":
                row = [random.randint(2, 5), random.randint(3, 8), random.randint(1, 4), round(random.uniform(4.0, 7.0), 2), 1, 0, 0, 0, 0, 1, 0, 0]
            elif attack_type == "takeover":
                row = [random.randint(1, 3), random.randint(2, 5), 0, round(random.uniform(5.5, 18.0), 2), 1, 1, 1, 0, 0, 1, 0, 0]
            else:  # mule hop / fan-in
                row = [random.randint(1, 4), random.randint(2, 6), 0, round(random.uniform(2.5, 9.0), 2), 1, 0, random.choice([0, 1]), 0, 0, 0, random.choice([0, 1]), 1]

        X.append(row)
        y.append(is_fraud)

    return X, y

def train_and_save() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    X, y = generate_synthetic_dataset(3000)

    # Save CSV so judges can inspect the training dataset
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(FEATURE_NAMES + ["label_is_fraud"])
        for row, label in zip(X, y):
            writer.writerow(row + [label])

    # Chronological / stratified 80-20 split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Shallow Random Forest with balanced class weights for fast <0.5ms inference
    clf = RandomForestClassifier(
        n_estimators=25,
        max_depth=6,
        class_weight="balanced",
        random_state=42,
        n_jobs=1,  # n_jobs=1 avoids thread-spawning overhead on single-row real-time inference
    )
    clf.fit(X_train, y_train)

    probs = clf.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)

    pr_auc = average_precision_score(y_test, probs)
    f1 = f1_score(y_test, preds)

    joblib.dump({"model": clf, "features": FEATURE_NAMES, "pr_auc": pr_auc, "f1": f1}, MODEL_PATH)

    print(f"[OK] Saved dataset -> {CSV_PATH} ({len(X)} rows)")
    print(f"[OK] Saved model   -> {MODEL_PATH}")
    print(f"[METRICS] PR-AUC: {pr_auc:.4f} | F1-Score: {f1:.4f}")
    print(classification_report(y_test, preds, target_names=["Legit (0)", "Fraud (1)"]))

if __name__ == "__main__":
    train_and_save()