// Print only the jobs that opened or closed since the previous run, for every board in a list.
//
// The first run labels every job "new" (it creates the baseline). Run it again later, or put the
// same input on a schedule, and you only get the differences.
//
// Usage:  node 03-new-jobs-feed.mjs [companies.txt]
//         The file has one board per line (ats:token or a board URL). Default: ../companies.txt
// Needs:  APIFY_TOKEN in the environment.
import { readFileSync } from 'node:fs';
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/ats-jobs-scraper';

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const file = process.argv[2] ?? new URL('../companies.txt', import.meta.url);
const companies = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
const runInput = {
    companies,
    trackChanges: true,
    changesOnly: true,
    changeTypes: ['new', 'removed'],
    includeDescription: false,
    snapshotStoreName: 'new-jobs-example',
};

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

let opened = 0;
let closed = 0;
for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType === 'company_status') {
        if (item.status !== 'ok') console.log(`${item.input}: ${item.status} - ${item.message}`);
        continue;
    }
    if (item.changeType === 'new') {
        opened += 1;
        console.log(`NEW     ${item.companyToken} | ${item.title} | ${item.location} | ${item.jobUrl}`);
    } else if (item.changeType === 'removed') {
        closed += 1;
        console.log(`CLOSED  ${item.companyToken} | ${item.title} | ${item.jobUrl}`);
    }
}
console.log(`${opened} opened, ${closed} closed since the last run`);
