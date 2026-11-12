// Write the open jobs of several boards to a CSV file, optionally filtered by title keywords.
//
// Usage:  node 02-jobs-to-csv.mjs [out.csv] [keyword ...]
//         Keywords match whole words in the title. Add * for a prefix: "engineer*" also matches "Engineering".
// Needs:  APIFY_TOKEN in the environment.
import { writeFileSync } from 'node:fs';
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/ats-jobs-scraper';

const COMPANIES = ['greenhouse:stripe', 'lever:palantir', 'ashby:ramp', 'ashby:notion'];
const FIELDS = [
    'ats', 'companyToken', 'companyName', 'jobId', 'title', 'department', 'team',
    'location', 'country', 'isRemote', 'workplaceType', 'employmentType',
    'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryInterval', 'postedAt', 'jobUrl',
];

function csvCell(value) {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const outPath = process.argv[2] ?? 'jobs.csv';
const keywords = process.argv.slice(3);
const runInput = { companies: COMPANIES, includeDescription: false };
if (keywords.length) runInput.titleKeywords = keywords;

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

const lines = [FIELDS.join(',')];
for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType !== 'job') {
        console.log(`${item.input}: ${item.status} - ${item.message}`);
        continue;
    }
    const pay = item.compensation ?? {};
    const row = { ...item, salaryMin: pay.min, salaryMax: pay.max, salaryCurrency: pay.currency, salaryInterval: pay.interval };
    lines.push(FIELDS.map((field) => csvCell(row[field])).join(','));
}
writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${lines.length - 1} jobs to ${outPath}`);
