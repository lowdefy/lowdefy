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

import { ServiceError } from '@lowdefy/errors';

import startMockTreg from '../../../test/startMockTreg.js';
import TregCall from './TregCall.js';

const TOKEN = 'tok_live_5ecret_value';

let mock;
let connection;

beforeEach(async () => {
  mock = await startMockTreg(() => ({ status: 200, body: {} }));
  connection = { token: TOKEN, baseUrl: mock.baseUrl };
});

afterEach(async () => {
  await mock.close();
});

const asyncView = {
  task_id: 'task_42',
  poll: { endpoint: 'wiza.people.email.status', param: { in: 'queryParams', name: 'id' } },
  status: { path: 'data.status', success: ['finished'], failure: ['failed'] },
};

const routedPendingBody = {
  output: { email: null },
  raw: { data: { id: 'task_42', status: 'queued' } },
  _treg: {
    served_by: 'wiza.people.email.find',
    provider: 'wiza',
    outcome: 'pending',
    tried: [{ endpoint_id: 'wiza.people.email.find', outcome: 'pending', status: 202 }],
    call_ref: 'call_child_1',
    async: asyncView,
    reserved_micro: 25000,
    charged_micro: null,
  },
};

const routedPending = {
  status: 202,
  headers: {
    'x-treg-call-id': 'call_parent_1',
    'x-treg-served-by': 'wiza.people.email.find',
    'x-treg-route-outcome': 'pending',
    'x-treg-reserved-micro': '25000',
    'x-treg-async': JSON.stringify(asyncView),
  },
  body: routedPendingBody,
};

function pollAnswers(answers) {
  let poll = 0;
  return (request) => {
    if (request.path === '/call/treg.people.email.find') return routedPending;
    const answer = answers[Math.min(poll, answers.length - 1)];
    poll += 1;
    return answer;
  };
}

const request = {
  endpoint: 'treg.people.email.find',
  body: { full_name: 'Ada Lovelace', domain: 'example.com' },
  idempotencyKey: 'claim_1',
  meta: { customer: 'cust_1' },
};

test('TregCall returns a pending result with the task and nothing charged when it does not await', async () => {
  mock.setHandler(() => routedPending);
  const result = await TregCall({ connection, request });
  expect(result.pending).toBe(true);
  expect(result.httpStatus).toBe(202);
  expect(result.outcome).toBe('pending');
  expect(result.cost).toEqual({ micro: 0, usd: 0 });
  expect(result.callId).toBe('call_parent_1');
  expect(result.task).toEqual({
    id: 'task_42',
    status: null,
    pollEndpoint: 'wiza.people.email.status',
    reserved: { micro: 25000, usd: 0.025 },
  });
  expect(mock.requests).toHaveLength(1);
});

test('TregCall polls an async task until it succeeds and returns the terminal answer', async () => {
  mock.setHandler(
    pollAnswers([
      { status: 200, headers: { 'x-treg-cost-micro': '0' }, body: { data: { status: 'running' } } },
      {
        status: 200,
        headers: { 'x-treg-cost-micro': '0' },
        body: { data: { status: 'finished', email: 'ada@example.com' } },
      },
    ])
  );
  const result = await TregCall({
    connection,
    request: { ...request, await: { timeoutMs: 5000, intervalMs: 100 } },
  });
  expect(result.pending).toBe(false);
  expect(result.output).toEqual({ data: { status: 'finished', email: 'ada@example.com' } });
  expect(result.raw).toEqual({ data: { status: 'finished', email: 'ada@example.com' } });
  expect(result.cost).toEqual({ micro: 25000, usd: 0.025 });
  expect(result.callId).toBe('call_parent_1');
  expect(result.servedBy).toBe('wiza.people.email.find');
  expect(result.task).toMatchObject({ id: 'task_42', status: 'finished' });
  expect(result.httpStatus).toBe(200);

  const polls = mock.requests.slice(1);
  expect(polls).toHaveLength(2);
  polls.forEach((poll) => {
    expect(poll.method).toBe('GET');
    expect(poll.path).toBe('/call/wiza.people.email.status');
    expect(poll.query).toEqual({ id: 'task_42' });
    expect(poll.headers['x-treg-token']).toBe(TOKEN);
    expect(poll.headers['idempotency-key']).toBeUndefined();
  });
});

test('TregCall reads a catalog task id and result through the descriptor paths', async () => {
  const descriptor = {
    id_from: 'task_id',
    poll: {
      endpoint: 'minimax.video-gen.task.status',
      param: { in: 'queryParams', name: 'task_id' },
    },
    status: { path: 'status', success: ['Success'], failure: ['Fail'] },
    result: { path: 'file.url' },
    interval: 10,
  };
  mock.setHandler((req) => {
    if (req.path === '/call/minimax.video-gen.h3.generate') {
      return {
        status: 200,
        headers: { 'x-treg-async': JSON.stringify(descriptor), 'x-treg-cost-micro': '470000' },
        body: { task_id: 'vid_9' },
      };
    }
    return { status: 200, body: { status: 'Success', file: { url: 'https://cdn.example/v.mp4' } } };
  });
  const result = await TregCall({
    connection,
    request: {
      endpoint: 'minimax.video-gen.h3.generate',
      body: { prompt: 'a cat' },
      await: { timeoutMs: 2000, intervalMs: 100 },
    },
  });
  expect(mock.requests[1].query).toEqual({ task_id: 'vid_9' });
  expect(result.output).toBe('https://cdn.example/v.mp4');
  expect(result.cost).toEqual({ micro: 470000, usd: 0.47 });
  expect(result.task.status).toBe('Success');
});

test('TregCall throws a final error when the async task fails', async () => {
  mock.setHandler(pollAnswers([{ status: 200, body: { data: { status: 'failed' } } }]));
  let error;
  try {
    await TregCall({ connection, request: { ...request, await: { intervalMs: 100 } } });
  } catch (err) {
    error = err;
  }
  expect(error).not.toBeInstanceOf(ServiceError);
  expect(ServiceError.isServiceError(error)).toBe(false);
  expect(error.code).toBe('async_task_failed');
  expect(error.message).toBe(
    'treg async task "task_42" for "treg.people.email.find" ended with status "failed".'
  );
});

test('TregCall throws a retryable error naming the call and task when the await budget runs out', async () => {
  mock.setHandler(pollAnswers([{ status: 200, body: { data: { status: 'running' } } }]));
  let error;
  try {
    await TregCall({
      connection,
      request: { ...request, await: { timeoutMs: 350, intervalMs: 100 } },
    });
  } catch (err) {
    error = err;
  }
  expect(error).toBeInstanceOf(ServiceError);
  expect(error.code).toBe('async_timeout');
  expect(error.retryAfter).toBe(1);
  expect(error.message).toContain('task "task_42"');
  expect(error.message).toContain('call id call_parent_1');
  expect(error.message).toContain('retry with the same idempotencyKey');
  expect(mock.requests.length).toBeGreaterThanOrEqual(3);
});

test('TregCall resumes a pending task from an idempotent replay, which carries no X-Treg-Async header', async () => {
  mock.setHandler((req) => {
    if (req.path === '/call/treg.people.email.find') {
      return {
        status: 202,
        headers: { 'x-treg-idempotent-replay': 'true', 'x-treg-cost-micro': '0' },
        body: routedPendingBody,
      };
    }
    return { status: 200, body: { data: { status: 'finished', email: 'ada@example.com' } } };
  });
  const result = await TregCall({
    connection,
    request: { ...request, await: { intervalMs: 100 } },
  });
  expect(result.replayed).toBe(true);
  expect(result.task).toMatchObject({ id: 'task_42', status: 'finished' });
  expect(result.cost).toEqual({ micro: 25000, usd: 0.025 });
  expect(mock.requests[1].path).toBe('/call/wiza.people.email.status');
});

test('TregCall keeps polling through a transient poll failure', async () => {
  mock.setHandler(
    pollAnswers([
      {
        status: 503,
        headers: { 'retry-after': '1' },
        body: { detail: 'busy', treg_saturated: true },
      },
      { status: 200, body: { data: { status: 'finished' } } },
    ])
  );
  const result = await TregCall({
    connection,
    request: { ...request, await: { intervalMs: 100 } },
  });
  expect(result.task.status).toBe('finished');
  expect(mock.requests).toHaveLength(3);
});

test('TregCall gives up after five transient poll failures in a row', async () => {
  mock.setHandler(pollAnswers([{ status: 500, body: {} }]));
  let error;
  try {
    await TregCall({ connection, request: { ...request, await: { intervalMs: 100 } } });
  } catch (err) {
    error = err;
  }
  expect(error).toBeInstanceOf(ServiceError);
  expect(error.message).toContain('the poll of async task "task_42"');
  expect(mock.requests).toHaveLength(6);
});

test('TregCall throws a final poll error at once', async () => {
  mock.setHandler(pollAnswers([{ status: 404, body: { detail: 'no such task' } }]));
  let error;
  try {
    await TregCall({ connection, request: { ...request, await: { intervalMs: 100 } } });
  } catch (err) {
    error = err;
  }
  expect(error.statusCode).toBe(404);
  expect(mock.requests).toHaveLength(2);
});

test('TregCall does not follow a descriptor that polls a URL', async () => {
  const descriptor = {
    id_from: 'id',
    poll: { url_from: 'polling_url', url_hosts: ['api.bfl.example'] },
    status: { path: 'status', success: ['Ready'], failure: ['Error'] },
  };
  mock.setHandler(() => ({
    status: 200,
    headers: { 'x-treg-async': JSON.stringify(descriptor) },
    body: { id: 'img_1', polling_url: 'https://api.bfl.example/v1/get_result?id=img_1' },
  }));
  let error;
  try {
    await TregCall({
      connection,
      request: { endpoint: 'bfl.image-gen.flux', body: {}, await: { intervalMs: 100 } },
    });
  } catch (err) {
    error = err;
  }
  expect(error.message).toContain('is polled at a URL, not a catalog endpoint');
  expect(mock.requests).toHaveLength(1);
});

test('TregCall refuses an X-Treg-Async header that is not JSON', async () => {
  mock.setHandler(() => ({ status: 202, headers: { 'x-treg-async': '{not json' }, body: {} }));
  await expect(TregCall({ connection, request: { endpoint: 'a.b', body: {} } })).rejects.toThrow(
    'treg answered "a.b" with an X-Treg-Async header that is not JSON.'
  );
});

test('TregCall refuses an async answer without a task id', async () => {
  mock.setHandler(() => ({
    status: 200,
    headers: { 'x-treg-async': JSON.stringify({ id_from: 'task_id', poll: {} }) },
    body: {},
  }));
  await expect(TregCall({ connection, request: { endpoint: 'a.b', body: {} } })).rejects.toThrow(
    'treg answered "a.b" with an async task but no task id.'
  );
});

test('TregCall stops polling when the request that started it closes', async () => {
  mock.setHandler(pollAnswers([{ status: 200, body: { data: { status: 'running' } } }]));
  const controller = new AbortController();
  const promise = TregCall({
    connection,
    request: { ...request, await: { intervalMs: 100 } },
    signal: controller.signal,
  });
  setTimeout(() => controller.abort(), 250);
  await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
});

test.each([
  ['0', 0],
  ['negative', -5],
  ['a tiny fraction', 0.001],
])(
  'TregCall waits at least 100 ms between polls when the descriptor interval is %s',
  async (_, interval) => {
    const descriptor = { ...asyncView, interval };
    mock.setHandler((req) => {
      if (req.path === '/call/treg.people.email.find') {
        return {
          ...routedPending,
          headers: { ...routedPending.headers, 'x-treg-async': JSON.stringify(descriptor) },
        };
      }
      return { status: 200, body: { data: { status: 'running' } } };
    });
    await expect(
      TregCall({ connection, request: { ...request, await: { timeoutMs: 450 } } })
    ).rejects.toMatchObject({ code: 'async_timeout' });
    // 450 ms at a 100 ms floor is at most 5 polls; an unbounded interval polls in a tight loop.
    expect(mock.requests.length - 1).toBeLessThanOrEqual(5);
    expect(mock.requests.length - 1).toBeGreaterThanOrEqual(2);
  }
);
