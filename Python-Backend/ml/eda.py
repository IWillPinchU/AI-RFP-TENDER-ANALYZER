import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = os.getenv("DATA_DIR", "data")

df = pd.read_csv(os.path.join(DATA_DIR, "training_data.csv"))

df = df[df["risk_label"].isin(["low", "medium", "high"])]

df["win_label"] = df["win_label"].astype(int)

df = df.drop_duplicates()

df.to_csv(os.path.join(DATA_DIR, "training_data_clean.csv"), index=False)

print("Cleaned dataset saved")
print(df["risk_label"].value_counts())
print(df["win_label"].value_counts())