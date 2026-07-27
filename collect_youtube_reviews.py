"""
Collect Devanagari-only Hindi movie review comments from YouTube.
Setup:
1. pip install youtube-comment-downloader
2. Run: python collect_youtube_reviews.py
"""

import re
import csv
from youtube_comment_downloader import YoutubeCommentDownloader

# Fill in each movie's trailer/review video URL (full URL, copied from browser address bar)
VIDEOS = [
    ("Chhaava", "https://www.youtube.com/watch?v=77vRyWNqZjM"),
    ("Dhurandhar", "https://www.youtube.com/watch?v=BKOVzHcjEIo"),
    ("Saiyaara", "https://www.youtube.com/watch?v=9r-tT5IN0vg"),
    ("War 2", "https://www.youtube.com/watch?v=mjBym9uKth4"),
    ("Deva", "https://www.youtube.com/watch?v=3x77q40hATw"),
    ("Animal", "https://www.youtube.com/watch?v=8FkLRUJj-o0"),
    ("Border 2", "https://www.youtube.com/watch?v=ysi8h4UfaZE"),
    ("Bhoot Bangla", "https://www.youtube.com/watch?v=D6sCbIv4N7Y"),
]

TARGET_TOTAL = 200
MAX_PER_MOVIE = 25
MIN_WORDS = 5
DEVANAGARI_RATIO_THRESHOLD = 0.9

DEVANAGARI_RE = re.compile(r'[\u0900-\u097F]')
LATIN_RE = re.compile(r'[a-zA-Z]')


def is_pure_devanagari(text: str) -> bool:
    letters = [c for c in text if c.isalpha() or DEVANAGARI_RE.match(c)]
    if not letters:
        return False
    dev_count = sum(1 for c in letters if DEVANAGARI_RE.match(c))
    has_latin = bool(LATIN_RE.search(text))
    return (dev_count / len(letters)) >= DEVANAGARI_RATIO_THRESHOLD and not has_latin


def clean_text(text: str) -> str:
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def fetch_comments(downloader, video_url, movie_name, rows, seen):
    movie_count = 0
    try:
        comments = downloader.get_comments_from_url(video_url, sort_by=1)  # 1 = sort by popularity
    except Exception as e:
        print(f"  Error fetching comments: {e}")
        return

    for comment in comments:
        if movie_count >= MAX_PER_MOVIE or len(rows) >= TARGET_TOTAL:
            break

        raw = comment.get("text", "")
        date = comment.get("time", "")
        text = clean_text(raw)

        if text in seen:
            continue
        if len(text.split()) < MIN_WORDS:
            continue
        if not is_pure_devanagari(text):
            continue

        seen.add(text)
        rows.append({
            "review_id": len(rows) + 1,
            "movie_name": movie_name,
            "source": "YouTube",
            "raw_text": text,
            "date": date,
            "word_count": len(text.split())
        })
        movie_count += 1


def main():
    downloader = YoutubeCommentDownloader()
    rows = []
    seen = set()

    for movie_name, video_url in VIDEOS:
        if len(rows) >= TARGET_TOTAL:
            break
        print(f"Fetching comments for: {movie_name}")
        fetch_comments(downloader, video_url, movie_name, rows, seen)
        print(f"  Total collected so far: {len(rows)}")

    out_path = "hindi_movie_reviews_raw.csv"
    with open(out_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["review_id", "movie_name", "source", "raw_text", "date", "word_count"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. {len(rows)} rows saved to {out_path}")
    print("Note: utf-8-sig encoding used so Devanagari displays correctly in Excel.")


if __name__ == "__main__":
    main()