import csv
import json
import random
from pathlib import Path
import joblib
from xgboost import XGBClassifier
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
        is_fraud = 1 if random.random() < 0.12 else 0

        if not is_fraud:
            row = [
                random.choices([0, 1, 2], weights=[0.85, 0.12, 0.03])[0],
                random.randint(0, 4),
                0,
                round(random.uniform(0.2, 2.2), 2),
                1 if random.random() < 0.15 else 0,
                1 if random.random() < 0.04 else 0,
                1 if random.random() < 0.05 else 0,
                1 if random.random() < 0.03 else 0,
                0,
                1 if random.random() < 0.08 else 0,
                0,
                0,
            ]
        else:
            attack_type = random.choice(["coercion", "micro_split", "takeover", "mule"])
            if attack_type == "coercion":
                row = [0, 1, 0, round(random.uniform(3.5, 12.0), 2), 1, 0, 0, 1, random.choice([0, 1]), 1, 0, 0]
            elif attack_type == "micro_split":
                row = [random.randint(2, 5), random.randint(3, 8), random.randint(1, 4), round(random.uniform(4.0, 7.0), 2), 1, 0, 0, 0, 0, 1, 0, 0]
            elif attack_type == "takeover":
                row = [random.randint(1, 3), random.randint(2, 5), 0, round(random.uniform(5.5, 18.0), 2), 1, 1, 1, 0, 0, 1, 0, 0]
            else:
                row = [random.randint(1, 4), random.randint(2, 6), 0, round(random.uniform(2.5, 9.0), 2), 1, 0, random.choice([0, 1]), 0, 0, 0, random.choice([0, 1]), 1]

        X.append(row)
        y.append(is_fraud)

    return X, y


def _compile_xgb_booster_to_tuples(booster) -> list:
    """Pre-compiles XGBoost JSON trees into flat pure-Python tuples for <0.03ms inference."""
    dump = booster.get_dump(dump_format="json")
    compiled_trees = []
    for tree_str in dump:
        tree_dict = json.loads(tree_str)
        nodes = {}

        def _walk(node):
            nid = node["nodeid"]
            if "leaf" in node:
                nodes[nid] = (-1, -1, -1, 0.0, float(node["leaf"]))
            else:
                split_feat = node["split"]
                feat_idx = int(split_feat[1:]) if split_feat.startswith("f") else FEATURE_NAMES.index(split_feat)
                thresh = float(node["split_condition"])
                yes_id = int(node["yes"])
                no_id = int(node["no"])
                nodes[nid] = (yes_id, no_id, feat_idx, thresh, 0.0)
                for child in node.get("children", []):
                    _walk(child)

        _walk(tree_dict)
        max_id = max(nodes.keys())
        flat_tree = [nodes.get(i, (-1, -1, -1, 0.0, 0.0)) for i in range(max_id + 1)]
        compiled_trees.append(flat_tree)
    return compiled_trees


def train_and_save() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    X, y = generate_synthetic_dataset(3000)

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(FEATURE_NAMES + ["label_is_fraud"])
        for row, label in zip(X, y):
            writer.writerow(row + [label])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    neg_count = sum(1 for label in y_train if label == 0)
    pos_count = max(sum(1 for label in y_train if label == 1), 1)

    # TrustLens XGBoost Classifier with scale_pos_weight for class imbalance
    clf = XGBClassifier(
        n_estimators=25,
        max_depth=5,
        learning_rate=0.15,
        scale_pos_weight=round(neg_count / pos_count, 2),
        eval_metric="logloss",
        random_state=42,
        n_jobs=1,
    )
    clf.fit(X_train, y_train)

    probs = clf.predict_proba(X_test)[:, 1]
    preds = (probs >= 0.5).astype(int)

    pr_auc = average_precision_score(y_test, probs)
    f1 = f1_score(y_test, preds)

    compiled_xgb_trees = _compile_xgb_booster_to_tuples(clf.get_booster())

    joblib.dump(
        {
            "model_type": "TrustLens-XGBoost",
            "model": clf,
            "compiled_xgb_trees": compiled_xgb_trees,
            "features": FEATURE_NAMES,
            "pr_auc": pr_auc,
            "f1": f1,
        },
        MODEL_PATH,
    )

    print(f"[OK] Saved dataset -> {CSV_PATH} ({len(X)} rows)")
    print(f"[OK] Saved TrustLens XGBoost model -> {MODEL_PATH}")
    print(f"[METRICS] PR-AUC: {pr_auc:.4f} | F1-Score: {f1:.4f}")
    print(classification_report(y_test, preds, target_names=["Legit (0)", "Fraud (1)"]))


if __name__ == "__main__":
    train_and_save()
