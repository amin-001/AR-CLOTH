"""
debug_recommend.py
====================
Standalone diagnostic script — connects to your real MongoDB collection
and shows you exactly what the recommendation engine sees, so you can
confirm prompt matching is working (or see why it isn't) without going
through the full photo-analysis pipeline.

Usage:
    python debug_recommend.py "office formalwear"
    python debug_recommend.py "summer wedding" --gender male --size M
"""

import os
import sys
import json
import argparse

from dotenv import load_dotenv
load_dotenv()

from recommend import get_collection, recommend_products, _extract_prompt_keywords


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("event", nargs="?", default="", help="Event/occasion to test, e.g. 'wedding'")
    parser.add_argument("--gender", default="male", choices=["male", "female", "neutral"])
    parser.add_argument("--size", default="M")
    parser.add_argument("--monk", type=int, default=5, help="Monk skin tone scale 1-10")
    args = parser.parse_args()

    print("=" * 70)
    print("STEP 1: Can we reach the collection at all?")
    print("=" * 70)
    try:
        coll = get_collection()
        count = coll.count_documents({})
        print(f"Connected OK. Document count in collection: {count}")
    except Exception as e:
        print(f"FAILED to connect / query: {e}")
        print("-> Check MONGO_URI / MONGO_DB_NAME / MONGO_COLLECTION_NAME in .env")
        sys.exit(1)

    if count == 0:
        print("\nYour configured collection is EMPTY or doesn't exist.")
        try:
            from pymongo import MongoClient
            client = MongoClient(os.environ.get("MONGO_URI"))
            db_name = os.environ.get("MONGO_DB_NAME", "test")
            print(f"Collections that DO exist in database '{db_name}':")
            for name in client[db_name].list_collection_names():
                n = client[db_name][name].count_documents({})
                print(f"  - {name}  ({n} documents)")
        except Exception as e:
            print(f"(couldn't list collections either: {e})")
        print("\n-> Set MONGO_COLLECTION_NAME in .env to the correct collection name above.")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("STEP 2: What does a real document actually look like?")
    print("=" * 70)
    sample = coll.find_one()
    print(json.dumps(sample, indent=2, default=str))

    print("\n" + "=" * 70)
    print(f"STEP 3: Keyword extraction for event: {args.event!r}")
    print("=" * 70)
    keywords = _extract_prompt_keywords(args.event)
    print(f"Extracted keywords: {keywords}")
    if not keywords and args.event:
        print("-> No keywords extracted from a non-empty event - check _heuristic_keywords/_STOPWORDS.")

    print("\n" + "=" * 70)
    print("STEP 4: Full recommend_products() call")
    print("=" * 70)
    results = recommend_products(
        gender=args.gender,
        size_label=args.size,
        monk_scale=args.monk,
        event=args.event,
        limit=10,
    )
    if not results:
        print("No results returned at all.")
    for r in results:
        name = r.get("display_name", "(no name found)")
        price = r.get("display_price", "(no price field found)")
        url = r.get("display_url", "(no url field found)")
        print(f"  score={r['match_score']:<5} {name}")
        print(f"           price={price}  url={url}")

    print("\nIf every score above is identical regardless of your event,")
    print("the keywords aren't matching anything in your documents. Compare")
    print("the keywords from STEP 3 against the actual text fields shown in")
    print("STEP 2 - they need to share words (e.g. keyword 'formal' needs")
    print("'formal' to literally appear somewhere in that document's text).")


if __name__ == "__main__":
    main()
