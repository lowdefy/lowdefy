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

import fs from 'node:fs';
import path from 'node:path';

import { createBuildHost, runHeadlessJourney } from '@lowdefy/journey-headless';
import { classifyJourney } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';
import { expect } from 'vitest';

import isDeepEqual from '../../lib/docs/isDeepEqual.js';
import selectFinalState from '../../lib/docs/selectFinalState.js';

// Where each check is recorded, one JSON line per journey, for the run's counts.
function recordPath() {
  return path.join(
    process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY,
    '.lowdefy',
    'parity',
    `${process.pid}.jsonl`
  );
}

function record(entry) {
  const filePath = recordPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(
    filePath,
    `${JSON.stringify({ test: expect.getState().currentTestName ?? null, ...entry })}\n`
  );
}

// Where a result failed: its step index, or "open" for the page open.
function failedAt(result) {
  if (result.passed !== false) return null;
  return result.failure?.index ?? result.failure?.phase ?? null;
}

// A detached CallApi dispatches through the server's own /api/detached route, which a production
// build opened in process (test-utils) does not serve: test-utils removes CRON_SECRET and has no
// origin to post to. The dev server's headless host serves it; until then such a journey is not
// compared.
const DETACHED_ON_BUILD = 'CallApi with "detached: true" requires the CRON_SECRET';

function needsServerHost(result) {
  return (result.failure?.errors ?? []).some((error) =>
    String(error.message).includes(DETACHED_ON_BUILD)
  );
}

function countAppErrors(result) {
  return result.failure?.errors?.length ?? 0;
}

// What differs between the browser's answer and the headless one, by the parity rules: passed,
// the failing step, the state selection asked for, and the number of app errors. Wording may
// differ by runner.
function findDifferences({ body, browser, headless }) {
  const differences = [];
  if (browser.passed !== headless.passed) {
    differences.push(`passed: browser ${browser.passed}, headless ${headless.passed}`);
  }
  if (failedAt(browser) !== failedAt(headless)) {
    differences.push(`failed at: browser ${failedAt(browser)}, headless ${failedAt(headless)}`);
  }
  if (countAppErrors(browser) !== countAppErrors(headless)) {
    differences.push(
      `app errors: browser ${countAppErrors(browser)}, headless ${countAppErrors(headless)}`
    );
  }
  if (type.isArray(body.state)) {
    const selected = selectFinalState({ state: headless.state, selection: body.state }).state;
    if (!isDeepEqual(browser.state, selected)) {
      differences.push(
        `state: browser ${JSON.stringify(browser.state)}, headless ${JSON.stringify(selected)}`
      );
    }
  }
  return differences;
}

function describe(result) {
  return JSON.stringify({
    passed: result.passed,
    failure: result.failure?.message ?? null,
    errors: (result.failure?.errors ?? []).map((error) => error.message),
  });
}

// The headless side of a fixture journey (LDF-1014): every journey the browser answered that
// classifyJourney calls headless runs again on the client engine in Node, over a production
// build of the fixture app with the journey's data set and user (@lowdefy/journey-headless'
// build host), and must give the same result. A journey the classifier leaves to the browser,
// one that reaches a browser-only step at run time, a mutant run (mutants exist on the dev server
// only) and one that reaches a detached CallApi (needsServerHost) are recorded and not compared. Set LOWDEFY_JOURNEY_PARITY=report to record
// differences without failing.
async function checkParity({ body, browser }) {
  const serverDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_PARITY_SERVER;
  if (type.isUndefined(serverDirectory) || process.env.LOWDEFY_JOURNEY_PARITY === 'off') {
    return;
  }
  const journey = {
    pageId: body.pageId,
    pathParams: body.pathParams,
    steps: body.steps ?? [],
    urlQuery: body.urlQuery,
  };
  const entry = { pageId: body.pageId ?? null, data: body.data ?? null };
  if (!type.isNone(body.mutant)) {
    record({ ...entry, kind: 'mutant' });
    return;
  }
  const classification = classifyJourney({ journey });
  if (!classification.headless) {
    record({ ...entry, kind: 'browser-only', reason: classification.reason });
    return;
  }
  const host = await createBuildHost({
    configDirectory: process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY,
    data: body.data,
    serverDirectory,
    user: body.user,
  });
  let headless;
  try {
    headless = await runHeadlessJourney({ host, journey, stepTimeout: body.timeout ?? 5000 });
  } finally {
    await host.close();
  }
  if (!type.isUndefined(headless.browserOnly)) {
    record({ ...entry, kind: 'browser-only at run time', reason: headless.browserOnly.reason });
    return;
  }
  if (needsServerHost(headless)) {
    record({ ...entry, kind: 'needs a server host', reason: 'a detached CallApi' });
    return;
  }
  const differences = type.isUndefined(headless.error)
    ? findDifferences({ body, browser, headless })
    : [`headless refused it: ${headless.error}`];
  if (differences.length === 0) {
    record({ ...entry, kind: 'same', passed: browser.passed });
    return;
  }
  record({
    ...entry,
    kind: 'different',
    differences,
    browser: describe(browser),
    headless: headless.error ?? describe(headless),
  });
  if (process.env.LOWDEFY_JOURNEY_PARITY !== 'report') {
    throw new Error(
      `The journey on page "${body.pageId}" gave a different result headless: ${differences.join(
        '; '
      )}.\nBrowser: ${describe(browser)}\nHeadless: ${headless.error ?? describe(headless)}`
    );
  }
}

export default checkParity;
