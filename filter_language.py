"""
Setup:
1. pip install langdetect langid pandas
2. Run: python filter_language.py
"""

import pandas as pd
from langdetect import detect, DetectorFactory
import langid

DetectorFactory.seed = 0  # makes langdetect deterministic across runs

INPUT_CSV = "hindi_movie_reviews_preprocessed.csv"
CONFIRMED_HINDI_CSV = "hindi_movie_reviews_filtered.csv"
REVIEW_NEEDED_CSV = "flagged_for_manual_language_review.csv"


def detect_langdetect(text):
    try:
        return detect(text)
    except Exception:
        return "unknown"


def detect_langid(text):
    return langid.classify(text)[0]


def main():
    df = pd.read_csv(INPUT_CSV, encoding="utf-8-sig")

    df["lang_langdetect"] = df["cleaned_text"].astype(str).apply(detect_langdetect)
    df["lang_langid"] = df["cleaned_text"].astype(str).apply(detect_langid)
    df["lang_agree"] = df["lang_langdetect"] == df["lang_langid"]

    confirmed_hindi = df[df["lang_agree"] & (df["lang_langdetect"] == "hi")].copy()
    needs_review = df[~(df["lang_agree"] & (df["lang_langdetect"] == "hi"))].copy()

    confirmed_hindi.to_csv(CONFIRMED_HINDI_CSV, index=False, encoding="utf-8-sig")
    needs_review.to_csv(REVIEW_NEEDED_CSV, index=False, encoding="utf-8-sig")

    print(f"Total rows: {len(df)}")
    print(f"Confirmed Hindi (both detectors agree): {len(confirmed_hindi)} -> {CONFIRMED_HINDI_CSV}")
    print(f"Flagged for manual review (disagreement or non-Hindi): {len(needs_review)} -> {REVIEW_NEEDED_CSV}")
    print("\nBreakdown of flagged rows by langdetect label:")
    print(needs_review["lang_langdetect"].value_counts())


if __name__ == "__main__":
    main()