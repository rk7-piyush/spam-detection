import pandas as pd

df = pd.read_csv("data/email_spam.csv", encoding="latin-1")
print("Shape:", df.shape)
print("Columns:", list(df.columns))
print(df.head())