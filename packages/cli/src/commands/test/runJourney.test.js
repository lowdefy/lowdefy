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

const mockPost = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { post: mockPost },
}));

const mockSeedFixtures = jest.fn();
jest.unstable_mockModule('./seedFixtures.js', () => ({ default: mockSeedFixtures }));

const mockUpdateJourneyFile = jest.fn();
jest.unstable_mockModule('./updateJourneyFile.js', () => ({ default: mockUpdateJourneyFile }));

beforeEach(() => {
  mockPost.mockReset();
  mockSeedFixtures.mockReset();
  mockUpdateJourneyFile.mockReset();
});

const journey = {
  name: 'submits the form',
  pageId: 'form',
  user: 'admin',
  urlQuery: { tab: 'new' },
  steps: [{ fill: { blockId: 'title', value: 'x' } }, { click: 'submit' }],
};
const item = { filePath: '/app/tests/journeys/form.yaml', journey };
const url = 'http://localhost:3228';
// A run that seeds nothing has no client, so no journey seeds before its page.
const context = { options: {}, directories: { config: '/app', dev: '/app/.lowdefy/dev' } };
const session = { client: null, fixtures: new Map(), seeded: new Map() };

test('runJourney posts the journey to the REST route and reports a pass', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockResolvedValue({
    data: { pageId: 'form', passed: true, steps: [{}, {}], state: {} },
  });
  const result = await runJourney({ context, item, session, url });
  expect(mockPost).toHaveBeenCalledWith('http://localhost:3228/lowdefy-docs/journey', {
    pageId: 'form',
    steps: journey.steps,
    user: 'admin',
    urlQuery: { tab: 'new' },
  });
  expect(result).toMatchObject({
    name: 'submits the form',
    filePath: item.filePath,
    passed: true,
    stepCount: 2,
  });
  expect(result.durationMs).toEqual(expect.any(Number));
});

test('runJourney returns the failure from a failed journey response', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const failure = {
    index: 1,
    step: { click: 'submit' },
    expected: 'block "submit" to be actionable',
    actual: 'Timeout 5000ms exceeded.',
    message: 'Step 1 failed.',
  };
  mockPost.mockResolvedValue({ data: { pageId: 'form', passed: false, failure, steps: [] } });
  const result = await runJourney({ context, item, session, url });
  expect(result).toMatchObject({ passed: false, failure, message: 'Step 1 failed.' });
});

test('runJourney reports a response carrying error as a failure', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockResolvedValue({ data: { error: 'Page "form" not found.' } });
  const result = await runJourney({ context, item, session, url });
  expect(result).toMatchObject({ passed: false, message: 'Page "form" not found.' });
});

test('runJourney reports a non-2xx response with its status and body', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const error = new Error('Request failed with status code 400');
  error.response = { status: 400, data: { error: 'Unknown dev user "admin".' } };
  mockPost.mockRejectedValue(error);
  const result = await runJourney({ context, item, session, url });
  expect(result).toMatchObject({
    passed: false,
    message: 'POST /lowdefy-docs/journey responded 400: {"error":"Unknown dev user \\"admin\\"."}',
  });
});

test('runJourney reports a transport failure with the error message', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3228'));
  const result = await runJourney({ context, item, session, url });
  expect(result).toMatchObject({
    passed: false,
    message: 'Could not reach the dev server: connect ECONNREFUSED 127.0.0.1:3228',
  });
});

test('runJourney reports an invalid journey without calling the server', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    context,
    session,
    item: { filePath: '/app/tests/journeys/bad.yaml', journey: { name: 'bad', pageId: 'p' } },
    url,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    name: 'bad',
    passed: false,
    stepCount: 0,
    message: 'Invalid journey file: Journey should have required property "steps".',
  });
});

test('runJourney reports a file that failed to parse using its file path as the name', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    context,
    session,
    item: { filePath: '/app/tests/journeys/broken.yaml', error: 'Invalid YAML: boom' },
    url,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    name: '/app/tests/journeys/broken.yaml',
    passed: false,
    message: 'Invalid YAML: boom',
  });
});

test('runJourney reports a typod top level key per file instead of ignoring it', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    context,
    session,
    item: {
      filePath: '/app/tests/journeys/typo.yaml',
      journey: { name: 'n', pageID: 'form', steps: [{ click: 'submit' }] },
    },
    url,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    name: 'n',
    filePath: '/app/tests/journeys/typo.yaml',
    passed: false,
    message:
      'Invalid journey file: Journey has unknown key "pageID". Journey keys are: fixtures, name, pageId, steps, urlQuery, user.',
  });
});

// The CLI and the dev server share one grammar, so a step malformed below the
// key level is a file error with a path, not a runtime failure discovered after
// a browser has opened.
test('runJourney reports a step malformed below the key level per file', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    context,
    session,
    item: {
      filePath: '/app/tests/journeys/steps.yaml',
      journey: { name: 'n', pageId: 'form', steps: [{ click: 'a' }, { fill: 'title' }] },
    },
    url,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result.passed).toBe(false);
  expect(result.filePath).toEqual('/app/tests/journeys/steps.yaml');
  expect(result.message).toEqual(
    'Invalid journey file: Step 1 "fill" requires { blockId, value }. Received "title".'
  );
});

test('runJourney reports an unknown expect form per file', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    context,
    session,
    item: {
      filePath: '/app/tests/journeys/expect.yaml',
      journey: { name: 'n', pageId: 'form', steps: [{ expect: { count: 2 } }] },
    },
    url,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result.message).toEqual(
    'Invalid journey file: Step 0 "expect" requires exactly one of "state", "visible", "text", "url", "dom", "durationMsUnder". Received {"count":2}.'
  );
});

const seededSession = () => ({
  client: { tag: 'client' },
  ObjectId: { tag: 'ObjectId' },
  fixtures: new Map([['base', { fixture: { name: 'base', connections: [] } }]]),
  seeded: new Map(),
});

test('runJourney seeds the journey fixtures before the page is opened', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockResolvedValue({ data: { passed: true, steps: [], state: {} } });
  const seeded = seededSession();
  const result = await runJourney({
    context,
    session: seeded,
    url,
    item: {
      filePath: '/app/tests/journeys/form.yaml',
      journey: { name: 'n', pageId: 'form', fixtures: ['base'], steps: [{ click: 'submit' }] },
    },
  });
  expect(mockSeedFixtures).toHaveBeenCalledTimes(1);
  expect(mockSeedFixtures.mock.calls[0][0].fixtures).toEqual([{ name: 'base', connections: [] }]);
  expect(mockSeedFixtures.mock.calls[0][0].seeded).toBe(seeded.seeded);
  expect(mockSeedFixtures.mock.invocationCallOrder[0]).toBeLessThan(
    mockPost.mock.invocationCallOrder[0]
  );
  expect(result.passed).toBe(true);
});

// The run-wide `seeded` map is what clears a collection an earlier test wrote,
// so a journey that names no fixture still seeds in a seeded run.
test('runJourney seeds a journey without fixtures when the run seeds anything', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockResolvedValue({ data: { passed: true, steps: [], state: {} } });
  await runJourney({ context, session: seededSession(), url, item });
  expect(mockSeedFixtures).toHaveBeenCalledTimes(1);
  expect(mockSeedFixtures.mock.calls[0][0].fixtures).toEqual([]);
});

test('runJourney fails a journey naming a fixture that failed to load', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const failing = seededSession();
  failing.fixtures.set('nope', { error: 'Fixture "nope" not found. Expected fixtures/nope.yaml.' });
  const result = await runJourney({
    context,
    session: failing,
    url,
    item: {
      filePath: '/app/tests/journeys/form.yaml',
      journey: { name: 'n', pageId: 'form', fixtures: ['nope'], steps: [{ click: 'submit' }] },
    },
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    passed: false,
    message: 'Fixture "nope" not found. Expected fixtures/nope.yaml.',
  });
});

test('runJourney fails an expectation with no equals when --update was not given', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  const result = await runJourney({
    context,
    session,
    url,
    item: {
      filePath: '/app/tests/journeys/form.yaml',
      journey: {
        name: 'n',
        pageId: 'form',
        steps: [{ click: 'submit' }, { expect: { state: { path: 'title' } } }],
      },
    },
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    passed: false,
    message:
      'Incomplete expectation at step 1: "expect.state" for path "title" has no "equals". Run lowdefy test --update to fill it from the observed state.',
  });
});

test('runJourney --update fills each empty expectation from the observed state and writes it back', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost
    .mockResolvedValueOnce({
      data: { passed: true, steps: [], state: { title: 'Access reviews' } },
    })
    .mockResolvedValueOnce({ data: { passed: true, steps: [], state: { count: 2 } } })
    .mockResolvedValueOnce({ data: { passed: true, steps: [], state: {} } });
  const result = await runJourney({
    context: { ...context, options: { update: true } },
    session,
    url,
    item: {
      filePath: '/app/tests/journeys/form.yaml',
      journeyIndex: 1,
      journey: {
        name: 'n',
        pageId: 'form',
        steps: [
          { click: 'submit' },
          { expect: { state: { path: 'title' } } },
          { expect: { state: { path: 'count' } } },
        ],
      },
    },
  });
  expect(mockUpdateJourneyFile.mock.calls.map(([args]) => args)).toEqual([
    {
      filePath: '/app/tests/journeys/form.yaml',
      journeyIndex: 1,
      stepIndex: 1,
      equals: 'Access reviews',
    },
    { filePath: '/app/tests/journeys/form.yaml', journeyIndex: 1, stepIndex: 2, equals: 2 },
  ]);
  // The last pass runs the whole journey with every expectation filled.
  expect(mockPost.mock.calls[0][1].steps).toEqual([{ click: 'submit' }]);
  expect(mockPost.mock.calls[2][1].steps).toEqual([
    { click: 'submit' },
    { expect: { state: { path: 'title', equals: 'Access reviews', from: 'recorded' } } },
    { expect: { state: { path: 'count', equals: 2, from: 'recorded' } } },
  ]);
  expect(result).toMatchObject({ passed: true, filled: 2 });
});

test('runJourney --update fails when the state the expectation names is undefined', async () => {
  const { default: runJourney } = await import('./runJourney.js');
  mockPost.mockResolvedValue({ data: { passed: true, steps: [], state: {} } });
  const result = await runJourney({
    context: { ...context, options: { update: true } },
    session,
    url,
    item: {
      filePath: '/app/tests/journeys/form.yaml',
      journey: {
        name: 'n',
        pageId: 'form',
        steps: [{ click: 'submit' }, { expect: { state: { path: 'title' } } }],
      },
    },
  });
  expect(mockUpdateJourneyFile).not.toHaveBeenCalled();
  expect(result).toMatchObject({
    passed: false,
    message:
      'Could not fill the expectation at step 1: state "title" is undefined when the journey reaches it.',
  });
});
