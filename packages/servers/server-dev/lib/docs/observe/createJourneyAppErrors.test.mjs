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

import { jest } from '@jest/globals';

jest.unstable_mockModule('./waitForClientErrorReports.js', () => ({ default: async () => {} }));

const { default: createJourneyAppErrors } = await import('./createJourneyAppErrors.js');
const { default: installStepObserver } = await import('./installStepObserver.js');
const { default: readStepObserver } = await import('./readStepObserver.js');
const { recordRunError, registerRunBuffer, releaseRunBuffer } = await import(
  '../runErrorBuffers.js'
);

const origin = 'http://localhost:3227';
const run = { run: '20261005T120000Z-ae0001', journey: null };
const recording = { source: 'journey', run: { id: run.run, by: 'test', journey: null } };

let emits;

function createPage() {
  return {
    evaluate: jest.fn(async (fn) => {
      if (fn === installStepObserver) return true;
      if (fn === readStepObserver) return { emits, mutationCount: 1 };
      return 'explore';
    }),
    url: () => `${origin}/explore`,
    isClosed: () => false,
  };
}

// A fake browser context: the watch's listeners, called as Playwright would.
function createContext() {
  const listeners = {};
  return {
    on: (event, callback) => {
      listeners[event] = callback;
    },
    respond({ url, status }) {
      listeners.response({
        url: () => url,
        status: () => status,
        request: () => ({ method: () => 'POST' }),
      });
    },
  };
}

function serverEntry({ message, recordingRun = run.run }) {
  return {
    timestamp: new Date().toISOString(),
    message,
    source: '/app/pages/explore.yaml:12',
    requestId: 'broken',
    pageId: 'explore',
    store: 'server',
    recording: { source: 'journey', run: recordingRun, journey: null },
  };
}

let page;
let journey;
let context;
let appErrors;

beforeEach(() => {
  emits = [];
  registerRunBuffer(run);
  appErrors = createJourneyAppErrors({ origin, basePath: '', recording, configDirectory: '/app' });
  context = createContext();
  appErrors.onContext({ context });
  page = createPage();
  journey = { actors: { current: () => ({ page }) } };
});

afterEach(() => {
  releaseRunBuffer(run);
});

async function runStepWindow({ step, during = () => {} }) {
  await appErrors.openWindow({ page });
  during();
  return appErrors.closeWindow({ journey, step, result: { status: 'ok' } });
}

test('a server error entry the run claimed fails the step, with the explorer kind, source and key', async () => {
  const findings = await runStepWindow({
    step: { click: 'broken' },
    during: () => recordRunError(serverEntry({ message: 'Unrecognized pipeline stage' })),
  });
  expect(findings).toEqual([
    expect.objectContaining({
      kind: 'server-error',
      severity: 'error',
      message: 'Unrecognized pipeline stage',
      source: 'pages/explore.yaml:12',
      key: 'server-error|explore|pages/explore.yaml:12',
    }),
  ]);
});

test("an error entry of another run is not this journey's", async () => {
  const other = { run: '20261005T120000Z-ae0002', journey: null };
  registerRunBuffer(other);
  const findings = await runStepWindow({
    step: { click: 'broken' },
    during: () => recordRunError(serverEntry({ message: 'elsewhere', recordingRun: other.run })),
  });
  releaseRunBuffer(other);
  expect(findings).toEqual([]);
});

test('an unexplained 5xx from an app API route fails the step as request-failed', async () => {
  const findings = await runStepWindow({
    step: { click: 'save' },
    during: () => context.respond({ url: `${origin}/api/request/explore/save`, status: 500 }),
  });
  expect(findings.map((finding) => finding.kind)).toEqual(['request-failed']);
});

test('a 403 refusal, a UserError and a dead click are not app errors', async () => {
  emits = [
    {
      blockId: 'throw_button',
      eventName: 'onClick',
      success: false,
      failure: { errorName: 'UserError', actionId: 'throw', actionType: 'Throw' },
    },
  ];
  const refused = await runStepWindow({
    step: { click: 'throw_button' },
    during: () => context.respond({ url: `${origin}/api/request/explore/admin`, status: 403 }),
  });
  expect(refused).toEqual([]);
  emits = [];
  page.evaluate.mockImplementation(async (fn) => {
    if (fn === readStepObserver) return { emits: [], mutationCount: 0 };
    return fn === installStepObserver ? true : 'explore';
  });
  const dead = await runStepWindow({ step: { click: 'dead_button' } });
  expect(dead).toEqual([]);
});

test('an action that fails with an error that is not a UserError fails the step as action-error', async () => {
  emits = [
    {
      blockId: 'explode_button',
      eventName: 'onClick',
      success: false,
      failure: { errorName: 'RequestError', actionId: 'call_explode', actionType: 'CallAPI' },
    },
  ];
  const findings = await runStepWindow({ step: { click: 'explode_button' } });
  expect(findings.map((finding) => finding.kind)).toEqual(['action-error']);
});

test('an error that lands between two steps is judged in the next window, not lost', async () => {
  expect(await runStepWindow({ step: { click: 'a' } })).toEqual([]);
  recordRunError(serverEntry({ message: 'between steps' }));
  const findings = await runStepWindow({ step: { expect: { visible: 'a' } } });
  expect(findings.map((finding) => finding.message)).toEqual(['between steps']);
});

test('judgeOpen fails with phase open on an error raised while the page opened', async () => {
  recordRunError(serverEntry({ message: 'onInit failed' }));
  const failure = await appErrors.judgeOpen({ page });
  expect(failure).toEqual({
    phase: 'open',
    kind: 'app-error',
    message: 'Opening the page caused an app error: server-error: onInit failed',
    expected: 'no app error',
    actual: ['server-error: onInit failed'],
    errors: [
      {
        kind: 'server-error',
        message: 'onInit failed',
        source: 'pages/explore.yaml:12',
        configKey: null,
        key: 'server-error|explore|pages/explore.yaml:12',
      },
    ],
  });
  expect(await appErrors.judgeOpen({ page })).toBeUndefined();
});

test('drain judges what arrived after the last window closed', async () => {
  expect(await runStepWindow({ step: { click: 'a' } })).toEqual([]);
  recordRunError(serverEntry({ message: 'late' }));
  const findings = await appErrors.drain({
    journey,
    step: { click: 'a' },
    result: { status: 'ok' },
  });
  expect(findings.map((finding) => finding.message)).toEqual(['late']);
});

// Runs steps through judgeStep as runJourneySteps does, with `during(index)`
// raising what each step causes.
async function judgeSteps({ steps, during = () => {} }) {
  const results = [];
  let failure;
  for (let index = 0; index < steps.length; index += 1) {
    if (failure !== undefined) {
      results.push({ index, status: 'skipped' });
      continue;
    }
    await appErrors.openWindow({ page });
    during(index);
    results.push({ index, status: 'ok' });
    failure = await appErrors.judgeStep({
      journey,
      steps,
      index,
      results,
      failure,
      leftOrigin: false,
    });
  }
  return { results, failure };
}

const duplicateSteps = [
  { click: 'save' },
  { expect: { error: 'duplicate key' } },
  { expect: { visible: 'already_exists' } },
];

test('expect.error claims the matching app error of the click before it, and the journey passes', async () => {
  const { results, failure } = await judgeSteps({
    steps: duplicateSteps,
    during: (index) => {
      if (index === 0) recordRunError(serverEntry({ message: 'E11000 duplicate key error' }));
    },
  });
  expect(failure).toBeUndefined();
  expect(results.map((result) => result.status)).toEqual(['ok', 'ok', 'ok']);
});

test('expect.error fails at the expect step when no app error matches', async () => {
  const { results, failure } = await judgeSteps({ steps: duplicateSteps });
  expect(failure).toEqual({
    index: 1,
    step: { expect: { error: 'duplicate key' } },
    expected: 'an app error containing "duplicate key"',
    actual: 'no app error',
    message: 'Expected an app error containing "duplicate key" but found no app error.',
  });
  expect(results.map((result) => result.status)).toEqual(['ok', 'failed', 'skipped']);
});

test('an app error expect.error does not claim still fails the click', async () => {
  const { results, failure } = await judgeSteps({
    steps: duplicateSteps,
    during: (index) => {
      if (index !== 0) return;
      recordRunError(serverEntry({ message: 'E11000 duplicate key error' }));
      recordRunError({
        ...serverEntry({ message: 'Connection lost' }),
        source: '/app/pages/explore.yaml:30',
      });
    },
  });
  expect(failure).toEqual(
    expect.objectContaining({
      index: 0,
      step: { click: 'save' },
      kind: 'app-error',
      actual: ['server-error: Connection lost'],
    })
  );
  expect(results.map((result) => result.status)).toEqual(['failed', 'ok', 'skipped']);
});

test('an app error with no expect.error after it fails its step', async () => {
  const { results, failure } = await judgeSteps({
    steps: [{ click: 'save' }, { expect: { visible: 'saved' } }],
    during: (index) => {
      if (index === 0) recordRunError(serverEntry({ message: 'E11000 duplicate key error' }));
    },
  });
  expect(failure).toEqual(expect.objectContaining({ index: 0, kind: 'app-error' }));
  expect(results.map((result) => result.status)).toEqual(['failed', 'skipped']);
});

test('expect.error claims the failed action that reported the error it matched', async () => {
  const failedInsert = {
    blockId: 'save',
    eventName: 'onClick',
    success: false,
    failure: { errorName: 'ServiceError', actionId: 'insert', actionType: 'Request' },
  };
  const { failure } = await judgeSteps({
    steps: duplicateSteps,
    during: (index) => {
      emits = index === 0 ? [failedInsert] : [];
      if (index === 0) recordRunError(serverEntry({ message: 'E11000 duplicate key error' }));
    },
  });
  expect(failure).toBeUndefined();
});
