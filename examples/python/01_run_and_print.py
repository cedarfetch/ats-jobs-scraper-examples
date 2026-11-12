"""Run the ATS Jobs Scraper on a few company boards and print one line per job.

Usage:  python 01_run_and_print.py [entry ...]
        entry is ats:token (greenhouse:stripe, lever:palantir, ashby:ramp) or a board URL.
Needs:  APIFY_TOKEN in the environment.
"""
import os
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/ats-jobs-scraper"


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    entries = sys.argv[1:] or ["greenhouse:stripe", "lever:palantir", "ashby:ramp"]
    run_input = {"companies": entries, "maxJobsPerCompany": 5, "includeDescription": False}

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    for item in client.dataset(run.default_dataset_id).iterate_items():
        if item["recordType"] == "company_status":
            # Boards that could not be read come back as free status rows.
            print(f"{item['input']}: {item['status']} - {item['message']}")
            continue
        pay = item["compensation"]
        pay_text = f"{pay['min']} to {pay['max']} {pay['currency']}/{pay['interval']}" if pay else "no pay published"
        print(
            f"{item['ats']}:{item['companyToken']} | {item['title']} | {item['location']}"
            f" | remote={item['isRemote']} | {pay_text} | {item['jobUrl']}"
        )


if __name__ == "__main__":
    main()
