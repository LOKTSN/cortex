"""Run discovery for all field preset profiles."""
import asyncio
import json
import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

from exa_discovery import run_exa_discovery

PROFILES = ["ai-ml", "crypto-web3", "biotech", "cybersecurity", "climate-tech"]


async def main():
    results = {}
    for profile_id in PROFILES:
        print(f"\n{'='*60}")
        print(f"RUNNING DISCOVERY: {profile_id}")
        print(f"{'='*60}")
        try:
            result = await run_exa_discovery(profile_id)
            results[profile_id] = result
            print(f"  -> {result.get('status')}: {len(result.get('topics_created', []))} topics created")
        except Exception as e:
            print(f"  -> ERROR: {e}")
            results[profile_id] = {"status": "error", "error": str(e)}

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    for pid, r in results.items():
        topics = r.get("topics_created", [])
        print(f"  {pid}: {r.get('status')} — {len(topics)} topics")
        for t in topics:
            print(f"    - {t}")

    return results


if __name__ == "__main__":
    asyncio.run(main())
