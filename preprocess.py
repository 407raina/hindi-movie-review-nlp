"""
Preprocessing pipeline for Hindi movie review dataset (Devanagari only).
Input:  hindi_movie_reviews_raw.csv (raw_text column untouched)
Output: hindi_movie_reviews_preprocessed.csv (adds new columns, does NOT overwrite raw_text)

Setup:
1. pip install indic-nlp-library pandas
2. Place hindi_stopwords.json in the same folder as this script
3. Run: python preprocess.py
"""

import re
import json
import unicodedata
import pandas as pd
from indicnlp.tokenize import indic_tokenize

INPUT_CSV = "hindi_movie_reviews_raw.csv"
OUTPUT_CSV = "hindi_movie_reviews_preprocessed.csv"
STOPWORDS_FILE = "hindi_stopwords.json"

# Common Hindi noun/verb suffixes for rule-based stemming (longest first, so e.g.
# "ों" is stripped before shorter suffixes are considered). This is a standard
# suffix-stripping approach used for Hindi in absence of a full morphological
# analyzer -- explicitly a simplification, not a linguistically perfect stemmer.
SUFFIXES = [
    "ाओं", "ियों", "ियाँ", "ाइयाँ",   # 4-char / plural-heavy suffixes
    "ेंगे", "ेंगी", "ाएगा", "ाएगी", "ाकर", "ाइए", "ाई", "ाया",
    "ेगा", "ेगी", "ोगे", "ोगी", "ाया", "ाते", "ाती", "ाता", "ाओ", "ाए",
    "ाओं", "ों", "ता", "ती", "ते", "ना", "नी", "ने", "ाँ", "ां", "ों",
    "ों", "ें", "े", "ी", "ा"
]
SUFFIXES = sorted(set(SUFFIXES), key=len, reverse=True)

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U00002700-\U000027BF"
    "\U0001F900-\U0001F9FF"
    "\U00002600-\U000026FF"
    "]+", flags=re.UNICODE
)


def load_stopwords(path):
    with open(path, encoding="utf-8") as f:
        return set(json.load(f))


def normalize_unicode(text: str) -> str:
    # Devanagari has combining characters (matras); NFC ensures consistent
    # representation so the same word doesn't appear as two different strings.
    return unicodedata.normalize("NFC", text)


def extract_emojis(text: str):
    emojis = EMOJI_PATTERN.findall(text)
    return "".join(emojis)


def remove_emojis(text: str) -> str:
    return EMOJI_PATTERN.sub("", text)


def normalize_elongation(text: str) -> str:
    # "अच्छााा" -> "अच्छा" : collapse 3+ repeated characters to 1
    return re.sub(r'(.)\1{2,}', r'\1', text)


def clean_text(text: str) -> str:
    text = re.sub(r'http\S+|www\.\S+', '', text)          # URLs
    text = re.sub(r'[,،]{2,}', ',', text)                   # repeated commas (",,,,")
    text = re.sub(r'[!]{2,}', '!', text)
    text = re.sub(r'[?]{2,}', '?', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def tokenize(text: str):
    return indic_tokenize.trivial_tokenize(text)


def remove_stopwords(tokens, stopwords):
    return [t for t in tokens if t not in stopwords]


def stem_word(word: str) -> str:
    for suf in SUFFIXES:
        if word.endswith(suf) and len(word) - len(suf) >= 2:
            return word[: -len(suf)]
    return word


def stem_tokens(tokens):
    return [stem_word(t) for t in tokens]


def main():
    stopwords = load_stopwords(STOPWORDS_FILE)
    df = pd.read_csv(INPUT_CSV, encoding="utf-8-sig")

    emoji_col, cleaned_col, tokens_col = [], [], []
    tokens_nostop_col, stemmed_col, final_text_col = [], [], []

    for raw in df["raw_text"].astype(str):
        text = normalize_unicode(raw)
        emojis = extract_emojis(text)

        text = remove_emojis(text)
        text = normalize_elongation(text)
        text = clean_text(text)

        tokens = tokenize(text)
        # keep only actual Devanagari word tokens; drop punctuation-only tokens
        # (note: danda "।" U+0964 falls inside the Devanagari block, so we must
        # explicitly filter pure-punctuation tokens, not just check the Unicode range)
        tokens = [
            t for t in tokens
            if re.search(r'[\u0900-\u097F]', t) and re.search(r'[\u0900-\u0963\u0966-\u097F]', t)
        ]

        tokens_nostop = remove_stopwords(tokens, stopwords)
        stemmed = stem_tokens(tokens_nostop)

        emoji_col.append(emojis)
        cleaned_col.append(text)
        tokens_col.append(" ".join(tokens))
        tokens_nostop_col.append(" ".join(tokens_nostop))
        stemmed_col.append(" ".join(stemmed))
        final_text_col.append(" ".join(stemmed))  # ready for feature engineering

    df["emojis_extracted"] = emoji_col
    df["cleaned_text"] = cleaned_col
    df["tokens"] = tokens_col
    df["tokens_no_stopwords"] = tokens_nostop_col
    df["stemmed_tokens"] = stemmed_col
    df["final_preprocessed_text"] = final_text_col

    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"Done. Preprocessed dataset saved to {OUTPUT_CSV}")
    print(f"Columns: {list(df.columns)}")


if __name__ == "__main__":
    main()