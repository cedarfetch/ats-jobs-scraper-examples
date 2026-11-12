// Run the ATS Jobs Scraper on a few company boards and print one line per job.
//
// Usage:  node 01-run-and-print.mjs [entry ...]
//         entry is ats:token (greenhouse:stripe, lever:palantir, ashby:ramp) or a board URL.
// Needs:  APIFY_TOKEN in the environment.
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/ats-jobs-scraper';

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const entries = process.argv.length > 2 ? process.argv.slice(2) : ['greenhouse:stripe', 'lever:palantir', 'ashby:ramp'];
const runInput = { companies: entries, maxJobsPerCompany: 5, includeDescription: false };

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType === 'company_status') {
        // Boards that could not be read come back as free status rows.
        console.log(`${item.input}: ${item.status} - ${item.message}`);
        continue;
    }
    const pay = item.compensation;
    const payText = pay ? `${pay.min} to ${pay.max} ${pay.currency}/${pay.interval}` : 'no pay published';
    console.log(
        `${item.ats}:${item.companyToken} | ${item.title} | ${item.location}`
        + ` | remote=${item.isRemote} | ${payText} | ${item.jobUrl}`,
    );
}
