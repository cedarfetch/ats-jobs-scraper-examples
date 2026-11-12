# ATS jobs scraper: Greenhouse, Lever and Ashby job board examples in Python, Node.js and cURL

Working examples for reading the open jobs of any company that hosts its careers page on Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee or Personio, using the [ATS Jobs Scraper Actor](https://apify.com/cedarfetch/ats-jobs-scraper) on Apify. Every vendor is normalised to one schema, and with change tracking on each row says whether the job is new, updated, unchanged or removed since the last run.

The scripts call the Actor from code with the official Apify API client. If you would rather not use a paid tool, the last section names the public job-board APIs it reads, so you can call them yourself.

## Quick start

You need an Apify API token (Integrations page in Apify Console, https://console.apify.com/account/integrations). Apify's free plan includes monthly platform credit, which is enough to try this.

**Python** (3.11 or newer, required by `apify-client` 3.x):

```bash
cd examples/python
pip install -r requirements.txt
export APIFY_TOKEN=your_token_here      # Windows cmd: set APIFY_TOKEN=your_token_here
python 01_run_and_print.py
```

On Windows, run `set PYTHONUTF8=1` first if the console fails on non-ASCII job titles.

**Node.js** (18 or newer):

```bash
cd examples/node
npm install
export APIFY_TOKEN=your_token_here
node 01-run-and-print.mjs
```

**cURL** (no install, one HTTP call):

```bash
export APIFY_TOKEN=your_token_here
bash examples/curl/run.sh
```

Each board is usually a single request, so a run over a handful of companies finishes in seconds. The output format is shown below, and real rows are in [`sample-output/sample.json`](sample-output/sample.json).

## What is in this repository

| Path | What it does |
|---|---|
| `examples/python/01_run_and_print.py` | Run the Actor on a few boards, print one line per job. |
| `examples/python/02_jobs_to_csv.py` | Write jobs to a CSV file, optionally filtered by title keywords. |
| `examples/python/03_new_jobs_feed.py` | Print only jobs that opened or closed since the last run, for a list of boards in `examples/companies.txt`. |
| `examples/node/01-run-and-print.mjs`, `02-jobs-to-csv.mjs`, `03-new-jobs-feed.mjs` | The same three scripts as ES modules. |
| `examples/curl/run.sh`, `input.json` | One-call version using the `run-sync-get-dataset-items` endpoint. |
| `sample-output/sample.json` | 9 real job rows from Greenhouse, Lever and Ashby, shortened (see below). |

The token is always read from the `APIFY_TOKEN` environment variable. Nothing is hard-coded.

## Input options

Only `companies` is required, one entry per line:

| You pass | Read as |
|---|---|
| `https://job-boards.greenhouse.io/stripe` (or a link to one of its jobs) | Greenhouse board `stripe` |
| `greenhouse:stripe`, `lever:palantir`, `lever-eu:acme`, `ashby:ramp`, `smartrecruiters:BoschGroup`, `workable:huggingface`, `recruitee:bunq`, `personio:acme` | that board (aliases `gh:` and `sr:`) |
| `stripe` with `defaultAts` set | a board named `stripe` on that ATS |
| `stripe` with `autoDetect: true` | every ATS that has an open board named `stripe` |

The options used most often:

| Field | Default | What it does |
|---|---|---|
| `maxJobsPerCompany` | 0 (all) | Stop after this many matching jobs per company. |
| `includeDescription` | true | Add `descriptionText` and `descriptionHtml`. Turn off for smaller rows. |
| `titleKeywords` | none | Keep titles containing these words (whole words, `engineer*` for a prefix, phrases work). |
| `excludeTitleKeywords` | none | Drop titles containing any of these words. |
| `locations` | none | Keep jobs whose locations or country match any of these words. |
| `departments` | none | Keep jobs whose department or team matches. |
| `remoteOnly` | false | Keep only jobs with `isRemote: true`. |
| `postedAfter` | none | ISO date (`2026-11-01`) or relative value (`7 days`, `24 hours`, `2 weeks`). |
| `employmentTypes` | none | Any of `full_time`, `part_time`, `contract`, `temporary`, `internship`, `apprenticeship`, `volunteer`, `other`. |
| `trackChanges` | false | Compare with the previous run and label every row. |
| `changesOnly` | false | With tracking on, deliver only the change types in `changeTypes`. |
| `changeTypes` | `new`, `updated`, `removed` | Which changes `changesOnly` delivers. |
| `snapshotStoreName` | `ats-jobs-scraper-snapshots` | Named key-value store for snapshots. Use different names for independent feeds. |
| `fetchGreenhousePay` | false | One extra request per matching Greenhouse job to read its published pay range. |

The Actor has more options (`defaultAts`, `autoDetect`, `titleKeywordsMode`, `concurrency` and others). See its [listing](https://apify.com/cedarfetch/ats-jobs-scraper) for the full input reference.

## Output

One row per job in the default dataset. `recordType` is `job`, or `company_status` for a board that could not be read (free). One row from [`sample-output/sample.json`](sample-output/sample.json), shortened:

```json
{
    "recordType": "job",
    "ats": "ashby",
    "companyToken": "ramp",
    "companyName": null,
    "jobId": "34413f8d-26bf-4bbc-8ade-eb309a0e2245",
    "title": "Security Engineer, Cloud",
    "department": "Engineering",
    "team": "Backend",
    "location": "New York, NY (HQ)",
    "locations": [
        "New York, NY (HQ)",
        "Remote (Canada)",
        "Remote (US)",
        "Miami, FL"
    ],
    "country": "USA",
    "isRemote": true,
    "workplaceType": "hybrid",
    "employmentType": "full_time",
    "employmentTypeRaw": "FullTime",
    "compensation": {
        "min": 211400,
        "max": 290600,
        "currency": "USD",
        "interval": "year",
        "text": "$211.4K – $290.6K • Offers Equity"
    },
    "postedAt": "2026-04-07T17:12:35.753Z",
    "jobUrl": "https://jobs.ashbyhq.com/ramp/34413f8d-26bf-4bbc-8ade-eb309a0e2245",
    "applyUrl": "https://jobs.ashbyhq.com/ramp/34413f8d-26bf-4bbc-8ade-eb309a0e2245/application",
    "matchedBy": "ats_prefix",
    "input": "ashby:ramp",
    "source": "api",
    "scrapedAt": "2026-11-12T00:46:17.655Z"
}
```

The sample file comes from running the Actor itself against three public boards on 2026-11-11 (up to three jobs per board) and keeps every field of each row. Only length was cut: long text is truncated with `...` and lists show their first few entries.

`compensation` is `null` unless the company publishes pay through the API. `isRemote` and `workplaceType` come from the ATS's own structured field when it has one, otherwise from the location names, and are `null` when nothing says. Fields an ATS does not expose are `null`, never guessed.

With change tracking on, rows also carry `changeType` (`new`, `updated`, `unchanged`, `removed`), `changedFields` and `previous` for updated jobs, `firstSeenAt`, and `removedAt` for removed jobs.

## Recipes

**New jobs at 50 companies, every day.** [`03_new_jobs_feed.py`](examples/python/03_new_jobs_feed.py) reads a list of boards from [`examples/companies.txt`](examples/companies.txt) and runs with `trackChanges`, `changesOnly` and `changeTypes: ["new", "removed"]`. The first run labels every job `new` because it creates the baseline. Schedule the same input daily in Apify Console and each run delivers only the jobs that opened or closed, and you pay only for those. The Actor accepts up to 2,000 boards per run.

**Engineering roles only.** `titleKeywords: ["engineer*"]` with `excludeTitleKeywords: ["intern"]`. Filters run before `maxJobsPerCompany`, so the cap counts matching jobs. [`02_jobs_to_csv.py`](examples/python/02_jobs_to_csv.py) takes keywords on the command line.

**Remote jobs posted this week, with salary.** `remoteOnly: true`, `postedAfter: "7 days"` and `fetchGreenhousePay: true`. Pay appears only where the company publishes it (Lever and Ashby when published, Greenhouse through the opt-in per-job request).

**Which ATS does a company use?** Pass bare names with `autoDetect: true` and a small `maxJobsPerCompany`. Each row says which ATS matched (`ats`, `matchedBy: "autodetect"`). Board names are first-come slugs, so a name can match a different company with the same slug: check `companyName` and `jobUrl`, and prefer a URL or `ats:token` once you know.

**Expire closed listings.** If you run a job board, keep `"removed"` in `changeTypes` and delete the listings that come back with `changeType: "removed"`. A job is only labelled `removed` after a complete, error-free read of its board.

## Pricing

The Actor uses pay-per-event pricing. Prices shown on the [Apify listing](https://apify.com/cedarfetch/ats-jobs-scraper) when this repository was written (2026-11-11):

- Job row: $0.0015 each (from $1.50 per 1,000 jobs), `removed` rows included.
- Actor start: $0.00005 per GB of run memory, minimum one event.
- `company_status` rows are free. With `changesOnly`, unchanged jobs are not delivered and not charged.

Apify's free plan includes monthly platform credit that you can use to try the Actor. Prices can change, so check the Pricing tab of the listing before you schedule anything. Set Maximum cost per run in the run options, or `maxTotalChargeUsd` in the API client, to cap spending.

## Limits and honest caveats

- Public postings only. It reads what the company publishes on its careers page. Internal, confidential and unlisted postings are out of reach by design. Nothing about applicants or employees is collected.
- Not supported: Workday, iCIMS, Taleo, SuccessFactors and other systems without a public, unauthenticated job feed, and custom career sites. If a company embeds Greenhouse or Ashby on its own domain, pass the link that contains `gh_jid=` or `ashby_jid=`, or use `greenhouse:<board>`.
- Auto-detect can match the wrong company, because board names are first-come slugs and companies often leave a stale board behind after switching ATS. It costs up to 7 requests per name.
- SmartRecruiters answers an unknown company identifier exactly like a company with no jobs, so a typo shows up as `no_jobs`. Identifiers are often not the plain company name (`BoschGroup`, `Ubisoft2`). Its descriptions need one request per job.
- Recruitee has announced that its Careers Site API will require a company-issued token from 10 February 2027. After that, Recruitee boards will be reported as `blocked` unless Recruitee changes course.
- Lever does not expose the company name, a last-updated date or requisition codes; its `postedAt` is the posting's creation time. Large Lever boards can take 20+ seconds per page of 100.
- Workable gives the publish date without a time, and no hybrid or on-site field (only a remote flag).
- Greenhouse lists jobs without pay; `fetchGreenhousePay` reads the pay range per job where the company publishes one for pay-transparency laws.
- Personio feeds come in the company's default language, and `companyName` is the hiring legal entity.
- Locations are as each company writes them and are not geocoded.
- The sync endpoint used by `run.sh` answers 408 after 300 seconds. For long runs use the Python or Node examples, which wait for the run to finish.
- You are responsible for how you use the data and for each source's terms.

## Do it yourself (no paid tool)

These vendors publish job-board APIs for exactly this use, and none needs a key. The Actor reads them directly:

| ATS | Endpoint |
|---|---|
| Greenhouse | `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` (all jobs in one request; `/jobs/{id}?pay_transparency=true` for a pay range) |
| Lever | `GET https://api.lever.co/v0/postings/{site}?mode=json&skip=0&limit=100` (EU companies: `api.eu.lever.co`) |
| Ashby | `GET https://api.ashbyhq.com/posting-api/job-board/{name}?includeCompensation=true` |
| SmartRecruiters | `GET https://api.smartrecruiters.com/v1/companies/{id}/postings?offset=0&limit=100` |
| Workable | `GET https://apply.workable.com/api/v1/widget/accounts/{subdomain}?details=true` |
| Recruitee | `GET https://{company}.recruitee.com/api/offers/` |
| Personio | `GET https://{company}.jobs.personio.de/xml` |

A minimal Python version for the first three, standard library only:

```python
import json
import urllib.request


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "job-reader/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


for job in get("https://boards-api.greenhouse.io/v1/boards/stripe/jobs")["jobs"][:5]:
    print("greenhouse", job["title"], job["location"]["name"], job["absolute_url"])

for job in get("https://api.lever.co/v0/postings/palantir?mode=json&limit=5"):
    print("lever", job["text"], job["categories"].get("location"), job["hostedUrl"])

for job in get("https://api.ashbyhq.com/posting-api/job-board/ramp")["jobs"][:5]:
    print("ashby", job["title"], job["location"], job["jobUrl"])
```

Every vendor uses different field names, date formats and remote flags, and Lever pages through `skip`. What the paid Actor adds on top: one schema across all seven, normalised employment type and remote or hybrid flags, salary ranges where published, keyword and date filters, polite retries, per-board error reporting, and the snapshot comparison behind `changeType`. If you only watch one or two boards, the endpoints above are enough.

## Related

Other example repositories from Cedarfetch Labs:

- [shopify-store-scraper-examples](https://github.com/cedarfetch/shopify-store-scraper-examples): Shopify product, price and stock data
- [remote-jobs-scraper-examples](https://github.com/cedarfetch/remote-jobs-scraper-examples): remote jobs from seven public boards
- [substack-scraper-examples](https://github.com/cedarfetch/substack-scraper-examples): Substack newsletter posts as Markdown
- [google-trending-searches-examples](https://github.com/cedarfetch/google-trending-searches-examples): what is trending on Google right now, per country

Listing: https://apify.com/cedarfetch/ats-jobs-scraper

Not affiliated with Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee or Personio.

Maintained by Cedarfetch Labs, the developer of this Actor.
