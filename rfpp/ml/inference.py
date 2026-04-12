import pickle
from ml.feature_eng import FeatureEngineer


class Predictor:
    def __init__(self):
        self.fe = FeatureEngineer()

        with open("models/risk_model.pkl", "rb") as f:
            self.risk_model = pickle.load(f)

        with open("models/win_model.pkl", "rb") as f:
            self.win_model = pickle.load(f)

    def predict(self, text):
        features = self.fe.extract_features(text)

        risk = self.risk_model.predict([features])[0]
        win_prob = self.win_model.predict_proba([features])[0][1]

        return {
            "risk": str(risk),
            "win_probability": float(round(win_prob * 100, 2))
        }


if __name__ == "__main__":
    predictor = Predictor()

    sample_text = """
    The bidder must have at least 10 years of experience.
    Failure to comply will result in termination and penalties.
    """

    result = predictor.predict(sample_text)

    print(result)