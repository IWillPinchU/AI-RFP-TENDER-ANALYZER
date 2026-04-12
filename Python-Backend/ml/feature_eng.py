class FeatureEngineer:

    def extract_features(self, text):
        text = text.lower()

        features = {}

        features["length"] = len(text)
        features["num_words"] = len(text.split())

        features["has_penalty"] = int("penalty" in text or "liability" in text)
        features["has_financial"] = int("cost" in text or "budget" in text)
        features["has_technical"] = int("technical" in text or "architecture" in text)

        features["must_count"] = text.count("must")
        features["required_count"] = text.count("required")

        features["has_termination"] = int("termination" in text)
        features["has_security"] = int("security" in text)

        return list(features.values())


if __name__ == "__main__":
    fe = FeatureEngineer()

    sample_text = """
    The bidder must have at least 7 years of experience.
    The bidder must comply with all security requirements.
    Failure to comply may lead to termination and penalty.
    """

    features = fe.extract_features(sample_text)

    print("Extracted Features:")
    print(features)
    print("Number of features:", len(features))