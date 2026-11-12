"""Write the open jobs of several boards to a CSV file, optionally filtered by title keywords.

Usage:  python 02_jobs_to_csv.py [out.csv] [keyword ...]
        Keywords match whole words in the title. Add * for a prefix: "engineer*" also matches "Engineering".
Needs:  APIFY_TOKEN in the environment.
"""
import csv
import os
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/ats-jobs-scraper"

COMPANIES = ["greenhouse:stripe", "lever:palantir", "ashby:ramp", "ashby:notion"]
FIELDS = [
    "ats", "companyToken", "companyName", "jobId", "title", "department", "team",
    "location", "country", "isRemote", "workplaceType", "employmentType",
    "salaryMin", "salaryMax", "salaryCurrency", "salaryInterval", "postedAt", "jobUrl",
]


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    out_path = sys.argv[1] if len(sys.argv) > 1 else "jobs.csv"
    keywords = sys.argv[2:]
    run_input = {"companies": COMPANIES, "includeDescription": False}
    if keywords:
        run_input["titleKeywords"] = keywords

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    rows = 0
    with open(out_path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        for item in client.dataset(run.default_dataset_id).iterate_items():
            if item["recordType"] != "job":
                print(f"{item['input']}: {item['status']} - {item['message']}")
                continue
            pay = item["compensation"] or {}
            item["salaryMin"] = pay.get("min")
            item["salaryMax"] = pay.get("max")
            item["salaryCurrency"] = pay.get("currency")
            item["salaryInterval"] = pay.get("interval")
            writer.writerow(item)
            rows += 1
    print(f"Wrote {rows} jobs to {out_path}")


if __name__ == "__main__":
    main()
