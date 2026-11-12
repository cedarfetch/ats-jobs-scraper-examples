"""Print only the jobs that opened or closed since the previous run, for every board in a list.

The first run labels every job "new" (it creates the baseline). Run it again later, or put the
same input on a schedule, and you only get the differences.

Usage:  python 03_new_jobs_feed.py [companies.txt]
        The file has one board per line (ats:token or a board URL). Default: ../companies.txt
Needs:  APIFY_TOKEN in the environment.
"""
import os
from pathlib import Path
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/ats-jobs-scraper"


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "companies.txt"
    companies = [
        line.strip() for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    run_input = {
        "companies": companies,
        "trackChanges": True,
        "changesOnly": True,
        "changeTypes": ["new", "removed"],
        "includeDescription": False,
        "snapshotStoreName": "new-jobs-example",
    }

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    opened = closed = 0
    for item in client.dataset(run.default_dataset_id).iterate_items():
        if item["recordType"] == "company_status":
            if item["status"] != "ok":
                print(f"{item['input']}: {item['status']} - {item['message']}")
            continue
        change = item.get("changeType")
        if change == "new":
            opened += 1
            print(f"NEW     {item['companyToken']} | {item['title']} | {item['location']} | {item['jobUrl']}")
        elif change == "removed":
            closed += 1
            print(f"CLOSED  {item['companyToken']} | {item['title']} | {item['jobUrl']}")
    print(f"{opened} opened, {closed} closed since the last run")


if __name__ == "__main__":
    main()
