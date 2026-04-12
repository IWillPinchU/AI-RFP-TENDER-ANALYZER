import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from ml.feature_eng import FeatureEngineer


class Trainer:
    def __init__(self):
        self.fe = FeatureEngineer()

    def train(self, path="data/training_data_clean.csv"):
        df = pd.read_csv(path)

        X = [self.fe.extract_features(text) for text in df["text"]]

        risk_model = RandomForestClassifier(
            n_estimators=200,
            class_weight="balanced",
            random_state=42
        )
        risk_model.fit(X, df["risk_label"])

        with open("models/risk_model.pkl", "wb") as f:
            pickle.dump(risk_model, f)

        win_model = RandomForestClassifier(
            n_estimators=200,
            class_weight="balanced",
            random_state=42
        )
        win_model.fit(X, df["win_label"])

        with open("models/win_model.pkl", "wb") as f:
            pickle.dump(win_model, f)

        print("Models trained and saved")


if __name__ == "__main__":
    trainer = Trainer()
    trainer.train()