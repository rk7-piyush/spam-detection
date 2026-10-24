from datasets import load_dataset
import pandas as pd

ds = load_dataset("SetFit/enron_spam")

# Combine all splits (train/test) into one table
df = pd.concat([ds[split].to_pandas() for split in ds.keys()], ignore_index=True)

df = df[["text", "label"]].rename(columns={"label": "label_num"})
df["label"] = df["label_num"].map({0: "ham", 1: "spam"})
df = df.dropna(subset=["text"]).drop_duplicates(subset=["text"])

print("Rows:", len(df))
print(df["label"].value_counts())

df.to_csv("data/email_spam.csv", index=False)
print("Saved to data/email_spam.csv")