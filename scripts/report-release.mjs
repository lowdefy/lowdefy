#!/usr/bin/env node

/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/**
 * Release report.
 *
 * The last job of a publishing Release run. Says in one place whether the release went out:
 * the version, the npm dist-tags and the GitHub release when it did, and the failed jobs and
 * steps, with links and what to do, when it did not. Written to the run's summary and as a
 * comment on the merged release pull request. Each attempt of the run edits the same comment,
 * so a re-run updates it instead of adding another.
 *
 * Environment (set by the workflow):
 *   DIST_TAG         the npm dist-tag the line publishes under
 *   RELEASE_BRANCH   the head branch of the release pull request (changeset-release/main)
 *   TEST_RESULT      needs.test.result, or empty when the line runs no tests before publishing
 *   PUBLISH_RESULT   needs.publish.result
 *   GITHUB_TOKEN     with actions: read and pull-requests: write
 *   GITHUB_*         the default Actions variables
 *
 * Zero external dependencies — uses only Node.js built-ins.
 */

import { appendFileSync, readFileSync } from 'node:fs';

const MARKER = '<!-- release-report -->';
const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const {
  DIST_TAG,
  GITHUB_REPOSITORY,
  GITHUB_RUN_ATTEMPT,
  GITHUB_RUN_ID,
  GITHUB_SERVER_URL,
  GITHUB_SHA,
  GITHUB_STEP_SUMMARY,
  GITHUB_TOKEN,
  PUBLISH_RESULT,
  RELEASE_BRANCH,
  TEST_RESULT,
} = process.env;
const RUN_URL = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
const FAILED = new Set(['failure', 'cancelled', 'timed_out']);

async function github(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`GitHub ${method} ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getFailedJobs() {
  const { jobs } = await github(
    `/repos/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}/attempts/${GITHUB_RUN_ATTEMPT}/jobs?per_page=100`
  );
  return jobs
    .filter((job) => FAILED.has(job.conclusion))
    .map((job) => ({
      name: job.name,
      url: job.html_url,
      step: (job.steps ?? []).find((step) => FAILED.has(step.conclusion))?.name ?? null,
    }));
}

async function getDistTags() {
  // The dist-tags of `lowdefy`, the CLI, which every release publishes.
  const response = await fetch('https://registry.npmjs.org/-/package/lowdefy/dist-tags', {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json();
}

async function getGithubRelease(version) {
  // Draft releases are only in the list, not at /releases/tags/<tag>.
  const releases = await github(`/repos/${GITHUB_REPOSITORY}/releases?per_page=20`);
  return releases.find((release) => release.tag_name === version) ?? null;
}

async function findReleasePullRequest() {
  const pulls = await github(`/repos/${GITHUB_REPOSITORY}/commits/${GITHUB_SHA}/pulls`);
  return pulls.find((pull) => pull.merged_at !== null && pull.head.ref === RELEASE_BRANCH) ?? null;
}

function describeFailure(job) {
  const where = job.step ? `${job.name}, step "${job.step}"` : job.name;
  return `- [${where}](${job.url})`;
}

function getAdvice({ failedJobs, version }) {
  const steps = failedJobs.map((job) => job.step);
  if (steps.includes('Verify all packages published')) {
    return `The packages were sent to npm, but npm did not show all of them in time. Once \`npm view lowdefy@${version.replace(/^v/, '')}\` finds them, re-run the failed jobs: the publish steps skip what is already on npm.`;
  }
  if (TEST_RESULT && TEST_RESULT !== 'success') {
    return 'Tests failed, so nothing was published. If the failure is a flaky test, re-run the failed jobs; otherwise fix it on `develop` and release again.';
  }
  return 'Read the failed step, fix the cause, then re-run the failed jobs. Every publish step is safe to run again.';
}

async function buildReport(version) {
  const attempt = `[attempt ${GITHUB_RUN_ATTEMPT}](${RUN_URL}/attempts/${GITHUB_RUN_ATTEMPT})`;
  if (PUBLISH_RESULT === 'success') {
    const [distTags, release] = await Promise.all([getDistTags(), getGithubRelease(version)]);
    const lines = [`## ✅ Published ${version}`, '', `Release run: ${attempt}.`, ''];
    if (distTags) {
      const tagged = distTags[DIST_TAG];
      const check = tagged === version.replace(/^v/, '') ? '' : ` ⚠️ expected ${version}`;
      lines.push(`- npm \`${DIST_TAG}\`: \`${tagged}\`${check}`);
      // A maintenance line must leave `latest` on the newest major.
      if (DIST_TAG !== 'latest') lines.push(`- npm \`latest\`: \`${distTags.latest}\``);
    }
    if (release?.draft) {
      lines.push(
        `- GitHub release [${version}](${release.html_url}) is a **draft**: publish it to announce the release.`
      );
    } else if (release) {
      lines.push(`- GitHub release: [${version}](${release.html_url})`);
    }
    return lines.join('\n');
  }
  const failedJobs = await getFailedJobs();
  return [
    `## ❌ ${version} was not released`,
    '',
    `Release run: ${attempt}. Failed:`,
    '',
    ...(failedJobs.length ? failedJobs.map(describeFailure) : [`- see the [run](${RUN_URL})`]),
    '',
    getAdvice({ failedJobs, version }),
  ].join('\n');
}

async function postToPullRequest(pull, report) {
  const body = `${MARKER}\n${report}`;
  const comments = await github(
    `/repos/${GITHUB_REPOSITORY}/issues/${pull.number}/comments?per_page=100`
  );
  const existing = comments.find((comment) => comment.body.startsWith(MARKER));
  if (existing) {
    await github(`/repos/${GITHUB_REPOSITORY}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      body: { body },
    });
  } else {
    await github(`/repos/${GITHUB_REPOSITORY}/issues/${pull.number}/comments`, {
      method: 'POST',
      body: { body },
    });
  }
}

const { version } = JSON.parse(readFileSync('packages/cli/package.json', 'utf8'));
const report = await buildReport(`v${version}`);
appendFileSync(GITHUB_STEP_SUMMARY, `${report}\n`);
console.log(report);

const pull = await findReleasePullRequest();
if (pull) {
  await postToPullRequest(pull, report);
  console.log(`\nReported on ${pull.html_url}`);
} else {
  console.log(`\nThis push is not the merge of a ${RELEASE_BRANCH} pull request: summary only.`);
}
