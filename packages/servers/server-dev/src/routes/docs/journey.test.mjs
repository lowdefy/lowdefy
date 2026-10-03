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

const mockRunJourney = jest.fn();

jest.unstable_mockModule('../../../lib/docs/runJourney.js', () => ({
  default: mockRunJourney,
}));
jest.unstable_mockModule('../../../lib/build/config.js', () => ({
  default: { basePath: '/app' },
}));
const mockGetBuildId = jest.fn(() => 'build-1');
jest.unstable_mockModule('../../../lib/docs/getBuildId.js', () => ({
  default: mockGetBuildId,
}));
const { readMutantRun } = await import('../../../lib/server/mutants/mutantRuns.js');
const { journeyActorToken } = await import('../../../lib/server/auth/journeyActor.js');

const { default: docsJourneyHandler } = await import('./journey.js');

function createContext(body) {
  const request = new Request('http://localhost:3227/lowdefy-docs/journey', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = jest.fn((data, status) => ({ data, status: status ?? 200 }));
  return { req: { url: request.url, json: () => request.json() }, json };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRunJourney.mockResolvedValue({
    pageId: 'form',
    passed: true,
    steps: [],
    screenshots: [{ name: 'after', data: 'cG5n', mimeType: 'image/png' }],
    state: {},
  });
});

test('docsJourneyHandler runs the journey against the request origin and returns the result', async () => {
  const c = createContext({
    pageId: 'form',
    steps: [{ click: 'submit' }],
    user: { roles: ['admin'] },
    urlQuery: { id: '1' },
  });

  const result = await docsJourneyHandler(c);

  expect(mockRunJourney).toHaveBeenCalledWith({
    origin: 'http://localhost:3227',
    pageId: 'form',
    steps: [{ click: 'submit' }],
    user: { roles: ['admin'] },
    urlQuery: { id: '1' },
    stepTimeout: undefined,
    basePath: '/app',
  });
  expect(result.status).toBe(200);
  expect(result.data.passed).toBe(true);
  expect(result.data.screenshots).toEqual([{ name: 'after', data: 'cG5n', mimeType: 'image/png' }]);
});

test('docsJourneyHandler returns a failed journey as 200 data', async () => {
  mockRunJourney.mockResolvedValue({
    pageId: 'form',
    passed: false,
    steps: [{ index: 0, step: { click: 'nope' }, status: 'failed', durationMs: 12 }],
    failure: { index: 0, step: { click: 'nope' }, expected: 'x', actual: 'y', message: 'm' },
    screenshots: [],
    state: {},
  });
  const c = createContext({ pageId: 'form', steps: [{ click: 'nope' }] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(200);
  expect(result.data.passed).toBe(false);
  expect(result.data.failure.index).toBe(0);
});

test('docsJourneyHandler returns 400 when pageId is missing', async () => {
  const c = createContext({ steps: [] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/requires a "pageId" string/);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 400 when steps is not an array', async () => {
  const c = createContext({ pageId: 'form', steps: { click: 'a' } });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/requires "steps" to be an array/);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 400 naming an unknown step', async () => {
  const c = createContext({ pageId: 'form', steps: [{ hover: 'a' }] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toEqual(
    'Step 0: Unknown journey step "hover". Steps are: click, open, fill, select, press, back, goto, email, as, wait, screenshot, expect.'
  );
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 400 when urlQuery is not an object', async () => {
  const c = createContext({ pageId: 'form', steps: [], urlQuery: 'id=1' });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/"urlQuery" param must be an object/);
});

test('docsJourneyHandler passes the state option through to the runner', async () => {
  const c = createContext({ pageId: 'form', steps: [], state: ['form.name'] });

  await docsJourneyHandler(c);

  expect(mockRunJourney).toHaveBeenCalledWith(expect.objectContaining({ state: ['form.name'] }));
});

test('docsJourneyHandler returns 400 when the state option is malformed', async () => {
  const c = createContext({ pageId: 'form', steps: [], state: 'form.name' });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(
    /"state" option must be true, false or an array of state paths/
  );
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 400 when user is malformed', async () => {
  const c = createContext({ pageId: 'form', steps: [], user: 'admin' });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/must be JSON/);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler passes user none through so the journey signs in through the app', async () => {
  const c = createContext({ pageId: 'login', steps: [{ goto: 'dashboard' }], user: 'none' });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(200);
  expect(mockRunJourney).toHaveBeenCalledWith(expect.objectContaining({ user: 'none' }));
});

test('docsJourneyHandler passes the journey timeout to the runner as the step timeout', async () => {
  const c = createContext({ pageId: 'form', steps: [], timeout: 20000 });

  await docsJourneyHandler(c);

  expect(mockRunJourney).toHaveBeenCalledWith(expect.objectContaining({ stepTimeout: 20000 }));
});

test('docsJourneyHandler returns 400 for a timeout outside 1 to 60000 ms', async () => {
  const c = createContext({ pageId: 'form', steps: [], timeout: 120000 });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/"timeout" must be a whole number of milliseconds/);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 502 when the journey could not run', async () => {
  mockRunJourney.mockResolvedValue({ error: 'No Chromium available.' });
  const c = createContext({ pageId: 'form', steps: [] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(502);
  expect(result.data.error).toEqual('No Chromium available.');
});

const mutant = {
  buildId: 'build-1',
  artifact: 'pages/form.json',
  key: 'k1_5',
  arg: null,
  operator: 'drop-block',
};

test('docsJourneyHandler opens a mutant run, passes its cookie to every actor and closes it after', async () => {
  let runDuringJourney;
  mockRunJourney.mockImplementation(async ({ mutantCookie }) => {
    runDuringJourney = readMutantRun(`lowdefy_journey_mutant=${journeyActorToken}.${mutantCookie}`);
    runDuringJourney.applied = 2;
    return { pageId: 'form', passed: true, steps: [], screenshots: [], state: {} };
  });
  const c = createContext({ pageId: 'form', steps: [{ click: 'submit' }], mutant });
  const result = await docsJourneyHandler(c);
  expect(result.status).toBe(200);
  expect(runDuringJourney.mutant).toEqual(mutant);
  expect(result.data.mutant).toEqual({ id: runDuringJourney.id, applied: 2, misses: [] });
  expect(
    readMutantRun(`lowdefy_journey_mutant=${journeyActorToken}.${runDuringJourney.id}`)
  ).toBeNull();
});

test('docsJourneyHandler closes the mutant run when the journey throws', async () => {
  let cookie;
  mockRunJourney.mockImplementation(async ({ mutantCookie }) => {
    cookie = mutantCookie;
    throw new Error('browser crashed');
  });
  const c = createContext({ pageId: 'form', steps: [{ click: 'submit' }], mutant });
  await expect(docsJourneyHandler(c)).rejects.toThrow('browser crashed');
  expect(readMutantRun(`lowdefy_journey_mutant=${journeyActorToken}.${cookie}`)).toBeNull();
});

test('docsJourneyHandler refuses a mutant listed against another build with 409 and stale', async () => {
  mockGetBuildId.mockReturnValueOnce('build-2');
  const c = createContext({ pageId: 'form', steps: [{ click: 'submit' }], mutant });
  const result = await docsJourneyHandler(c);
  expect(result.status).toBe(409);
  expect(result.data.stale).toBe(true);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test.each([['../x.json'], ['connections/a.json'], ['pages/../secrets.json'], [5]])(
  'docsJourneyHandler refuses a mutant artifact %j with 400',
  async (artifact) => {
    const c = createContext({
      pageId: 'form',
      steps: [{ click: 'submit' }],
      mutant: { ...mutant, artifact },
    });
    const result = await docsJourneyHandler(c);
    expect(result.status).toBe(400);
    expect(result.data.error).toContain('"mutant.artifact"');
    expect(mockRunJourney).not.toHaveBeenCalled();
  }
);

test.each([
  [{ operator: 'drop-everything' }, '"mutant.operator"'],
  [{ key: 5 }, '"mutant.key"'],
])('docsJourneyHandler refuses a bad mutant %j with 400', async (override, field) => {
  const c = createContext({
    pageId: 'form',
    steps: [{ click: 'submit' }],
    mutant: { ...mutant, ...override },
  });
  const result = await docsJourneyHandler(c);
  expect(result.status).toBe(400);
  expect(result.data.error).toContain(field);
});

test('docsJourneyHandler passes no mutant cookie and returns no mutant without a mutant', async () => {
  const c = createContext({ pageId: 'form', steps: [{ click: 'submit' }] });
  const result = await docsJourneyHandler(c);
  expect(mockRunJourney.mock.calls[0][0].mutantCookie).toBeUndefined();
  expect(result.data.mutant).toBeUndefined();
});

test('docsJourneyHandler passes a recording through as a test run of source journey', async () => {
  const c = createContext({
    pageId: 'form',
    steps: [{ click: 'submit' }],
    recording: { run: '20261003T151200Z-p0d4rm', journey: 'tests/journeys/a.yaml#Assign' },
  });
  await docsJourneyHandler(c);
  expect(mockRunJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      recording: {
        source: 'journey',
        run: { id: '20261003T151200Z-p0d4rm', by: 'test', journey: 'tests/journeys/a.yaml#Assign' },
      },
    })
  );
});

test('docsJourneyHandler returns 400 for a malformed recording', async () => {
  for (const recording of [
    { run: '../x' },
    { run: '' },
    'run',
    { run: '20261003T151200Z-p0d4rm', journey: 7 },
  ]) {
    const result = await docsJourneyHandler(
      createContext({ pageId: 'form', steps: [{ click: 'submit' }], recording })
    );
    expect(result.status).toBe(400);
  }
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler refuses a journey that declares a data set rather than run it on the real database', async () => {
  const c = createContext({ pageId: 'form', steps: [{ click: 'submit' }], data: 'staging-sample' });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch('cannot run journeys on data sets yet');
  expect(mockRunJourney).not.toHaveBeenCalled();
});
