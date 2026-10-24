import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

os.makedirs("model", exist_ok=True)


def load_sms():
    df = pd.read_csv("data/spam.csv", encoding="latin-1")[["v1", "v2"]]
    df.columns = ["label", "text"]
    df["y"] = (df["label"].str.strip().str.lower() == "spam").astype(int)
    return df[["text", "y"]].dropna().drop_duplicates()


def load_email():
    df = pd.read_csv("data/email_spam.csv", encoding="latin-1")
    print("Email file columns:", list(df.columns), "| rows:", len(df))
    cols = {c.strip().lower(): c for c in df.columns}

    text_col = next((cols[c] for c in ["text", "message", "email", "body", "content"] if c in cols), None)
    if text_col is None:
        raise ValueError(f"Could not find a text column. Columns found: {list(df.columns)}")

    label_col = next((cols[c] for c in ["label_num", "label", "category", "spam", "class"] if c in cols), None)
    if label_col is None:
        raise ValueError(f"Could not find a label column. Columns found: {list(df.columns)}")

    df = df.dropna(subset=[text_col, label_col])
    raw = df[label_col]

    if raw.dtype == object:
        y = raw.astype(str).str.strip().str.lower().map({"spam": 1, "ham": 0, "1": 1, "0": 0})
    else:
        y = raw

    out = pd.DataFrame({"text": df[text_col].astype(str), "y": y}).dropna()
    out["y"] = out["y"].astype(int)
    out = out.drop_duplicates()

    # Sanity checks with clear messages
    if not set(out["y"].unique()).issubset({0, 1}):
        raise ValueError(f"Labels must be 0/1 or ham/spam, but found: {sorted(out['y'].unique())}. "
                         "This is probably the wrong dataset file.")
    if len(out) < 500:
        raise ValueError(f"Only {len(out)} usable rows found. Expected thousands. "
                         "This is probably the wrong or an incomplete dataset file.")
    return out

def train(df, name, max_features):
    print(f"\n===== {name.upper()} MODEL =====")
    print("Dataset size:", df.shape)
    print(df["y"].value_counts().rename({0: "ham", 1: "spam"}))

    X_train, X_test, y_train, y_test = train_test_split(
        df["text"], df["y"], test_size=0.2, random_state=42, stratify=df["y"]
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(lowercase=True, stop_words="english",
                                  ngram_range=(1, 2), max_features=max_features,
                                  sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("Accuracy:", round(accuracy_score(y_test, y_pred), 4))
    print(classification_report(y_test, y_pred, target_names=["ham", "spam"]))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    path = f"model/{name}_model.pkl"
    joblib.dump(model, path, compress=3)
    print("Saved:", path)


train(load_sms(), "sms", max_features=20000)
train(load_email(), "email", max_features=50000)