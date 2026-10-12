"""
app.py
------
Flask backend for the Hindi Movie Sentiment Analysis website.

Run:
    python app.py

On first start it trains the model from ../dataset/movie_reviews.csv
(or loads a cached model from ./models/ if one already exists) and
keeps everything in memory so API requests are fast.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from model import load_or_train, predict_review
from recommendation import build_movie_stats

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "..", "dataset", "movie_reviews.csv")

app = Flask(__name__)
CORS(app)

print("मॉडल लोड/प्रशिक्षित किया जा रहा है (loading/training model)...")
try:
    VECTORIZER, MODEL, DATAFRAME, METRICS = load_or_train(DATASET_PATH)
    MOVIE_STATS = build_movie_stats(DATAFRAME)
    LOAD_ERROR = None
    print(f"तैयार: {len(DATAFRAME)} समीक्षाएँ, {DATAFRAME['movie_name'].nunique()} फिल्में।")
except Exception as exc:  # noqa: BLE001
    VECTORIZER = MODEL = DATAFRAME = METRICS = None
    MOVIE_STATS = []
    LOAD_ERROR = str(exc)
    print("डेटासेट लोड नहीं हो सका:", LOAD_ERROR)


def dataset_guard():
    if LOAD_ERROR or DATAFRAME is None:
        return jsonify({"error": "डेटासेट लोड नहीं हो सका। कृपया डेटासेट की जाँच करें।"}), 500
    return None


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    err = dataset_guard()
    if err:
        return err
    total = len(DATAFRAME)
    pos = int((DATAFRAME["sentiment"] == "positive").sum())
    neg = int((DATAFRAME["sentiment"] == "negative").sum())
    neu = int((DATAFRAME["sentiment"] == "neutral").sum())
    avg_watch = round(sum(m["watchability_score"] for m in MOVIE_STATS) / max(len(MOVIE_STATS), 1), 1)

    return jsonify({
        "total_movies": int(DATAFRAME["movie_name"].nunique()),
        "total_reviews": total,
        "positive_count": pos,
        "negative_count": neg,
        "neutral_count": neu,
        "positive_pct": round(pos / total * 100, 1) if total else 0,
        "negative_pct": round(neg / total * 100, 1) if total else 0,
        "neutral_pct": round(neu / total * 100, 1) if total else 0,
        "avg_watchability": avg_watch,
        "model_metrics": METRICS,
    })


@app.route("/api/movies", methods=["GET"])
def movies():
    err = dataset_guard()
    if err:
        return err
    return jsonify({"movies": MOVIE_STATS})


@app.route("/api/movie/<path:movie_name>", methods=["GET"])
def movie_detail(movie_name):
    err = dataset_guard()
    if err:
        return err
    match = next((m for m in MOVIE_STATS if m["movie_name"].lower() == movie_name.lower()), None)
    if not match:
        return jsonify({"error": "इस नाम की फिल्म डेटासेट में नहीं मिली।"}), 404

    reviews = DATAFRAME[DATAFRAME["movie_name"].str.lower() == movie_name.lower()]
    sample_reviews = [
        {
            "text": row["raw_text"],
            "sentiment": row["sentiment"],
            "confidence": row["sentiment_confidence"],
        }
        for _, row in reviews.head(10).iterrows()
    ]
    result = dict(match)
    result["sample_reviews"] = sample_reviews
    return jsonify(result)


@app.route("/api/predict", methods=["POST"])
def predict():
    err = dataset_guard()
    if err:
        return err
    payload = request.get_json(silent=True) or {}
    review = (payload.get("review") or "").strip()
    if not review:
        return jsonify({"error": "कृपया अपनी समीक्षा लिखें।"}), 400

    sentiment_en, confidence = predict_review(VECTORIZER, MODEL, review)
    hindi_map = {"positive": "सकारात्मक", "negative": "नकारात्मक", "neutral": "तटस्थ"}
    return jsonify({
        "sentiment": sentiment_en,
        "sentiment_hindi": hindi_map.get(sentiment_en, sentiment_en),
        "confidence": round(confidence, 4),
    })


@app.route("/api/retrain", methods=["POST"])
def retrain():
    """Force a fresh training run (useful after replacing the dataset)."""
    global VECTORIZER, MODEL, DATAFRAME, METRICS, MOVIE_STATS, LOAD_ERROR
    try:
        VECTORIZER, MODEL, DATAFRAME, METRICS = load_or_train(DATASET_PATH, force_retrain=True)
        MOVIE_STATS = build_movie_stats(DATAFRAME)
        LOAD_ERROR = None
        return jsonify({"status": "ok", "metrics": METRICS})
    except Exception as exc:  # noqa: BLE001
        LOAD_ERROR = str(exc)
        return jsonify({"error": "डेटासेट लोड नहीं हो सका। कृपया डेटासेट की जाँच करें।"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
