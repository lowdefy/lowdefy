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

import {
  fixtureTest,
  fixtureUrl,
  launchChromium,
  postJourney,
  postJson,
} from './fixtureClient.mjs';

// A journey fails at the step that causes an app error, judged with the
// explorer's invariants: the same controls of the fixture's explore page
// give a journey the kinds and finding keys they give an explorer walk.
// Expected outcomes (a failed Validate, a Throw) pass, and only errors the
// journey's own browser caused count.

let runCount = 0;
function newRunId() {
  runCount += 1;
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  return `${stamp}-ae${String(runCount).padStart(4, '0')}`;
}

// The explorer's findings for one click on the explore page, over the same
// fixture database the journeys use.
async function walkClick({ blockId, walk }) {
  const opened = await postJson({
    path: '/lowdefy-docs/explore/walks',
    body: {
      pageId: 'explore',
      user: 'member',
      data: 'explore',
      run: newRunId(),
      walk,
      record: false,
    },
  });
  if (opened.status !== 200) {
    throw new Error(`The walk did not open: ${JSON.stringify(opened.body)}`);
  }
  const { walkId, observation } = opened.body;
  try {
    const candidate = observation.candidates.find(
      (entry) => entry.kind === 'click' && entry.target.blockId === blockId
    );
    const stepped = await postJson({
      path: `/lowdefy-docs/explore/walks/${walkId}/steps`,
      body: { step: { click: candidate.target } },
    });
    return stepped.body.findings;
  } finally {
    await fetch(`${fixtureUrl}/lowdefy-docs/explore/walks/${walkId}`, { method: 'DELETE' });
  }
}

function sortedKinds(errors) {
  return errors.map((error) => error.kind).sort();
}

function sortedKeys(errors) {
  return errors.map((error) => error.key).sort();
}

describe.each([
  ['a block property whose _js throws', 'boom_button', 'client-error'],
  ['a request whose connection throws', 'broken_request_button', 'server-error'],
  ['a CallAPI whose endpoint fails', 'explode_button', 'action-error'],
  ['a request with a $search stage', 'search_button', 'environment'],
])('%s', (description, blockId, kind) => {
  fixtureTest(
    `fails the journey at the click that triggers it, with the explorer's ${kind} kind and key`,
    async () => {
      const result = await postJourney({
        pageId: 'explore',
        user: 'member',
        data: 'explore',
        steps: [
          { expect: { visible: blockId } },
          { click: blockId },
          { expect: { visible: blockId } },
        ],
      });
      expect(result.passed).toBe(false);
      expect(result.failure).toEqual(
        expect.objectContaining({
          index: 1,
          step: { click: blockId },
          kind: 'app-error',
          expected: 'no app error',
        })
      );
      expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed', 'skipped']);
      expect(sortedKinds(result.failure.errors)).toContain(kind);
      result.failure.errors.forEach((error) => {
        expect(error.key).toEqual(expect.stringMatching(/\|explore\|/));
      });

      const findings = await walkClick({ blockId, walk: `compare-${blockId}` });
      const walkErrors = findings.filter(
        (finding) => finding.severity === 'error' || finding.kind === 'environment'
      );
      expect(sortedKinds(result.failure.errors)).toEqual(sortedKinds(walkErrors));
      expect(sortedKeys(result.failure.errors)).toEqual(sortedKeys(walkErrors));
    }
  );
});

fixtureTest('a request error carries its config source', async () => {
  const result = await postJourney({
    pageId: 'explore',
    data: 'explore',
    user: 'member',
    steps: [{ click: 'broken_request_button' }],
  });
  const serverError = result.failure.errors.find((error) => error.kind === 'server-error');
  expect(serverError.source).toMatch(/^pages\/explore\.yaml:\d+$/);
});

fixtureTest('a failed Validate does not fail a journey', async () => {
  const result = await postJourney({
    pageId: 'explore',
    steps: [{ click: 'validate_button' }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('a Throw action, a user error, does not fail a journey', async () => {
  const result = await postJourney({
    pageId: 'app_errors',
    steps: [{ click: 'throw_button' }, { expect: { visible: 'throw_button' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('an onInit request that throws fails the journey on open', async () => {
  const result = await postJourney({
    pageId: 'app_errors_open',
    steps: [{ expect: { visible: 'app_errors_open_title' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    expect.objectContaining({ phase: 'open', kind: 'app-error', expected: 'no app error' })
  );
  expect(result.failure.index).toBeUndefined();
  expect(sortedKinds(result.failure.errors)).toContain('server-error');
  expect(result.steps.map((step) => step.status)).toEqual(['skipped']);
});

fixtureTest(
  "an error from a developer's own tab during a journey does not fail it and reaches build-status; the journey's own does not",
  async () => {
    const browser = await launchChromium();
    try {
      const started = new Date().toISOString();
      const journey = postJourney({
        pageId: 'explore',
        steps: [{ wait: { ms: 4000 } }, { expect: { visible: 'dead_button' } }],
      });
      const page = await browser.newPage();
      await page.goto(`${fixtureUrl}/explore`);
      await page.getByRole('button', { name: 'Broken request' }).click();
      const result = await journey;
      expect(result.passed).toBe(true);

      const failing = await postJourney({
        pageId: 'explore',
        steps: [{ click: 'broken_request_button' }],
      });
      expect(failing.passed).toBe(false);

      const status = await (await fetch(`${fixtureUrl}/lowdefy-docs/build-status`)).json();
      const recent = status.serverErrors.filter((entry) => entry.timestamp >= started);
      expect(recent.length).toBeGreaterThan(0);
      recent.forEach((entry) => {
        expect(entry.recording).toBeNull();
      });
    } finally {
      await browser.close();
    }
  }
);

fixtureTest('two journeys at once each fail only on their own errors', async () => {
  const [broken, calm] = await Promise.all([
    postJourney({ pageId: 'explore', steps: [{ click: 'broken_request_button' }] }),
    postJourney({ pageId: 'explore', steps: [{ click: 'validate_button' }] }),
  ]);
  expect(broken.passed).toBe(false);
  expect(sortedKinds(broken.failure.errors)).toEqual(['action-error', 'server-error']);
  expect(calm.passed).toBe(true);
});

fixtureTest(
  'expect.error claims the error the click before it raises, and fails when none matches',
  async () => {
    const asserted = await postJourney({
      pageId: 'explore',
      steps: [
        { click: 'broken_request_button' },
        { expect: { error: 'rejected the MongoDBAggregation' } },
        { expect: { visible: 'broken_request_button' } },
      ],
    });
    expect(asserted.failure).toBeUndefined();
    expect(asserted.passed).toBe(true);

    const unmatched = await postJourney({
      pageId: 'explore',
      steps: [{ click: 'broken_request_button' }, { expect: { error: 'duplicate key' } }],
    });
    expect(unmatched.passed).toBe(false);
    expect(unmatched.failure).toEqual(
      expect.objectContaining({
        index: 1,
        step: { expect: { error: 'duplicate key' } },
        expected: 'an app error containing "duplicate key"',
      })
    );
  }
);
