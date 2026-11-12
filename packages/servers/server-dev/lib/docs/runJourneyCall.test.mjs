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

import { vi, expect, test } from 'vitest';

const { default: runJourneyCall } = await import('./runJourneyCall.js');
const { default: expectAnswerError } = await import('./expectAnswerError.js');
const { default: expectAnswerStatus } = await import('./expectAnswerStatus.js');
const { default: validateBrowserCallChecks } = await import('./validateBrowserCallChecks.js');
const { default: describePageNeed } = await import('./describePageNeed.js');

// A journey whose actors answer callerFor with a context whose API client answers `answer`.
function createJourney({ status = 200, body = {} } = {}) {
  const post = vi.fn(async () => ({
    status: () => status,
    ok: () => status >= 200 && status < 300,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }));
  const counter = { recordCall: vi.fn() };
  const callerFor = vi.fn(async () => ({ context: { request: { post } }, counter }));
  return {
    journey: { origin: 'http://localhost:3227', basePath: '/app', actors: { callerFor } },
    callerFor,
    counter,
    post,
  };
}

test('runJourneyCall posts an endpoint call as the client does, through the caller it names, and counts it', async () => {
  const { journey, callerFor, counter, post } = createJourney({ body: { logged: true } });
  const answer = await runJourneyCall({
    journey,
    step: { call: { endpoint: 'log_activity', payload: { source: 'x' }, as: 'member' } },
    timeout: 5000,
  });
  expect(callerFor).toHaveBeenCalledWith('member');
  expect(post).toHaveBeenCalledWith('http://localhost:3227/app/api/endpoints/log_activity', {
    data: { payload: { source: 'x' } },
    failOnStatusCode: false,
    timeout: 5000,
  });
  expect(counter.recordCall).toHaveBeenCalledWith({
    url: 'http://localhost:3227/app/api/endpoints/log_activity',
    method: 'POST',
  });
  expect(answer).toEqual({ description: 'endpoint "log_activity"', status: 200, error: null });
  expect(journey.lastAnswer).toBe(answer);
});

test('runJourneyCall posts a request step to the request route with an empty payload by default', async () => {
  const { journey, callerFor, post } = createJourney();
  await runJourneyCall({
    journey,
    step: { request: { pageId: 'orders', requestId: 'get_order' } },
    timeout: 5000,
  });
  expect(callerFor).toHaveBeenCalledWith(undefined);
  expect(post).toHaveBeenCalledWith(
    'http://localhost:3227/app/api/request/orders/get_order',
    expect.objectContaining({ data: { payload: {} } })
  );
});

test('runJourneyCall keeps a refusal as the answer, with the error the app sent', async () => {
  const { journey } = createJourney({
    status: 403,
    body: { name: 'AuthorizationError', message: 'API Endpoint "auditor_only" does not exist.' },
  });
  const answer = await runJourneyCall({
    journey,
    step: { call: { endpoint: 'auditor_only' } },
    timeout: 5000,
  });
  expect(answer).toEqual({
    description: 'endpoint "auditor_only"',
    status: 403,
    error: 'API Endpoint "auditor_only" does not exist.',
  });
});

test('runJourneyCall reads an answer with no app error from its text', async () => {
  const { journey } = createJourney({ status: 502, body: 'Bad Gateway' });
  const answer = await runJourneyCall({
    journey,
    step: { call: { endpoint: 'auditor_only' } },
    timeout: 5000,
  });
  expect(answer.error).toBe('502 Bad Gateway');
});

test('expectAnswerStatus and expectAnswerError read the last answer', () => {
  const journey = {
    lastAnswer: { description: 'endpoint "auditor_only"', status: 403, error: 'Not allowed.' },
  };
  expect(() => expectAnswerStatus({ journey, status: 403 })).not.toThrow();
  expect(() => expectAnswerStatus({ journey, status: 200 })).toThrow(
    'Expected endpoint "auditor_only" to answer 200 but it answered 403: Not allowed.'
  );
  expect(() => expectAnswerError({ journey, text: 'allowed' })).not.toThrow();
  expect(() => expectAnswerError({ journey, text: 'missing' })).toThrow(
    'Expected endpoint "auditor_only" to answer with an error containing "missing" but its error was "Not allowed.".'
  );
  const ok = { lastAnswer: { description: 'endpoint "log"', status: 200, error: null } };
  expect(() => expectAnswerError({ journey: ok, text: 'x' })).toThrow(
    'Expected endpoint "log" to answer with an error containing "x" but it answered 200 with no error.'
  );
});

test('validateBrowserCallChecks refuses expect.calls on a payload or response, and keeps count', () => {
  expect(
    validateBrowserCallChecks({ steps: [{ expect: { calls: { endpoint: 'e', count: 1 } } }] })
  ).toBeUndefined();
  expect(
    validateBrowserCallChecks({
      steps: [{ click: 'a' }, { expect: { calls: { endpoint: 'e', payload: { a: 1 } } } }],
    })
  ).toBe(
    'Step 1: expect.calls with "payload" or "response" needs a headless run (the browser runner does not record payloads yet).'
  );
  expect(
    validateBrowserCallChecks({ steps: [{ expect: { calls: { request: 'r', response: null } } }] })
  ).toMatch(/^Step 0: /);
});

test('describePageNeed allows a page-less journey of call steps only', () => {
  expect(
    describePageNeed({ steps: [{ call: { endpoint: 'e' } }, { expect: { status: 200 } }] })
  ).toBeUndefined();
  expect(describePageNeed({ steps: [] })).toBe(
    'requires a "pageId" string: a journey with no steps opens a page. Received undefined.'
  );
  expect(describePageNeed({ steps: [{ call: { endpoint: 'e' } }, { goto: 'home' }] })).toBe(
    'requires a "pageId" string: step 1 (goto) needs a page. Received undefined.'
  );
});
