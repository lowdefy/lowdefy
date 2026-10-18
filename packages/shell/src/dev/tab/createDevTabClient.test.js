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
import { waitFor } from '@testing-library/react-native';
import { get, serializer } from '@lowdefy/helpers';

import createDevTabClient from './createDevTabClient.js';
import DEV_CLIENT_MARKER from './devClientMarker.js';
import { DEV_CLIENT_MARKER as BUNDLE_MARKER } from '../../../shellVariant.js';

// The tab channel's payloads, shared with the dev server's tests
// (server-dev src/routes/devInspect.test.mjs): a phone answers in a browser tab's shape.
const fixtures = require('../../../../servers/server-dev/test/tabChannelFixtures.json');

const apiBase = 'http://192.168.1.20:3000';

function createStream() {
  const encoder = new TextEncoder();
  const chunks = [];
  let waiting = null;
  let closed = false;
  function deliver(result) {
    const resolve = waiting;
    waiting = null;
    resolve(result);
  }
  return {
    body: {
      getReader: () => ({
        read: () => {
          if (chunks.length > 0) return Promise.resolve({ done: false, value: chunks.shift() });
          if (closed) return Promise.resolve({ done: true });
          return new Promise((resolve) => {
            waiting = resolve;
          });
        },
      }),
    },
    send(event, data) {
      const value = encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      if (waiting) deliver({ done: false, value });
      else chunks.push(value);
    },
    close() {
      closed = true;
      if (waiting) deliver({ done: true });
    },
  };
}

// The app-level lowdefy object with the fixture page on screen at /tickets/7.
function createLowdefy() {
  const context = {
    ...fixtures.pageContext,
    state: { ...fixtures.pageContext.state },
    pathParams: fixtures.page.pathParams,
    _internal: {
      parser: {
        parse: ({ input }) => ({ output: get(context.state, input._state), errors: [] }),
      },
      State: {
        set: (key, value) => {
          context.state[key] = value;
        },
      },
      update: jest.fn(),
    },
  };
  return {
    basePath: '',
    pathMemory: new Map([['tickets/7', fixtures.page]]),
    contexts: { [fixtures.page.instanceKey]: context },
    inputs: { [fixtures.page.instanceKey]: fixtures.app.input },
    lowdefyGlobal: fixtures.app.lowdefyGlobal,
    user: fixtures.app.user,
    _internal: {
      globals: {
        window: {
          location: {
            href: `${apiBase}/tickets/7${fixtures.app.urlQuery}`,
            search: fixtures.app.urlQuery,
          },
        },
      },
    },
  };
}

function setup({ device, stream = createStream(), streamFetch, pollEvents = [] } = {}) {
  const fetch = jest.fn(async (url) => {
    if (url.includes('transport=poll')) {
      return { ok: true, json: async () => ({ tabId: 'phone', events: pollEvents.splice(0) }) };
    }
    return { ok: true, json: async () => ({ ok: true }) };
  });
  const onReload = jest.fn(async () => undefined);
  const onStep = jest.fn(async ({ step }) => ({ ok: true, ran: step }));
  const onInject = jest.fn(({ injection }) => ({ ok: true, kind: injection.kind, pending: 1 }));
  const client = createDevTabClient({
    apiBase,
    device,
    fetch,
    getLowdefy: createLowdefy,
    onInject,
    onReload,
    onStep,
    pollInterval: 10,
    streamFetch: streamFetch ?? jest.fn(async () => ({ ok: true, body: stream.body })),
  });
  client.start();
  return { client, fetch, onInject, onReload, onStep, stream };
}

function posts(fetch, path) {
  return fetch.mock.calls
    .filter(([url, init]) => url === `${apiBase}/api/dev-inspect${path}` && init.method === 'POST')
    .map(([, init]) => JSON.parse(init.body));
}

let running;
afterEach(() => {
  running?.client.stop();
  running?.stream.close();
});

test('the marker a release bundle is checked for is the one the client sends', () => {
  expect(DEV_CLIENT_MARKER).toBe(BUNDLE_MARKER);
});

test('the shell registers as a tab on the reload stream and posts the page it shows', async () => {
  running = setup();
  const { client, fetch, stream } = running;
  expect(posts(fetch, '/page')).toEqual([]);
  stream.send('tab', { tabId: 'phone' });
  await waitFor(() =>
    expect(posts(fetch, '/page')).toEqual([{ tabId: 'phone', ...fixtures.page }])
  );
  expect(client.getTabId()).toBe('phone');
});

test('the stream is opened on /api/reload with the dev client marker', async () => {
  const stream = createStream();
  const streamFetch = jest.fn(async () => ({ ok: true, body: stream.body }));
  running = setup({ stream, streamFetch });
  await waitFor(() => expect(streamFetch).toHaveBeenCalled());
  const [url, init] = streamFetch.mock.calls[0];
  expect(url).toBe(`${apiBase}/api/reload?client=${DEV_CLIENT_MARKER}`);
  expect(init.headers).toEqual({ Accept: 'text/event-stream' });
});

test('the stream names the phone platform and app id for the device tools', async () => {
  const stream = createStream();
  const streamFetch = jest.fn(async () => ({ ok: true, body: stream.body }));
  running = setup({ device: { platform: 'ios', app: 'com.lowdefy.dev' }, stream, streamFetch });
  await waitFor(() => expect(streamFetch).toHaveBeenCalled());
  expect(streamFetch.mock.calls[0][0]).toBe(
    `${apiBase}/api/reload?client=${DEV_CLIENT_MARKER}&platform=ios&app=com.lowdefy.dev`
  );
});

test('a load-state-request sets the checkpoint state on the page and answers the keys it verified', async () => {
  running = setup();
  running.stream.send(fixtures.loadStateRequest.event, {
    requestId: 'r-load',
    ...fixtures.page,
    ...fixtures.loadStateRequest.payload,
  });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  expect(posts(running.fetch, '')[0]).toEqual({
    requestId: 'r-load',
    result: fixtures.loadStateResult,
  });
});

test('a reload event reloads the app', async () => {
  running = setup();
  running.stream.send('reload', {});
  await waitFor(() => expect(running.onReload).toHaveBeenCalledTimes(1));
});

test('an inspect-request is answered with the payload a browser tab posts', async () => {
  running = setup();
  running.stream.send(fixtures.inspectRequest.event, {
    requestId: 'r-inspect',
    ...fixtures.page,
    ...fixtures.inspectRequest.payload,
  });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  const [answer] = posts(running.fetch, '');
  expect(answer.requestId).toBe('r-inspect');
  expect(serializer.deserializeFromString(answer.result)).toEqual(fixtures.inspectResult);
});

test('an eval-request is answered with the payload a browser tab posts', async () => {
  running = setup();
  running.stream.send(fixtures.evalRequest.event, {
    requestId: 'r-eval',
    ...fixtures.page,
    ...fixtures.evalRequest.payload,
  });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  const [answer] = posts(running.fetch, '');
  expect(answer.requestId).toBe('r-eval');
  expect({
    value: serializer.deserializeFromString(answer.result.value),
    errors: answer.result.errors,
  }).toEqual(fixtures.evalResult);
});

test('a request for a page with no live context is answered with an error', async () => {
  running = setup();
  running.stream.send('inspect-request', {
    requestId: 'r-gone',
    pageId: 'home',
    pathParams: {},
    instanceKey: 'page:home',
  });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  expect(posts(running.fetch, '')[0]).toEqual({
    requestId: 'r-gone',
    result: { error: 'No live context for page "home".' },
  });
});

test('a step-request runs the journey step and posts its result', async () => {
  running = setup();
  running.stream.send('step-request', {
    requestId: 'r-step',
    ...fixtures.page,
    step: { click: 'save' },
  });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  expect(running.onStep).toHaveBeenCalledWith({
    step: { click: 'save' },
    page: fixtures.page,
  });
  expect(posts(running.fetch, '')[0]).toEqual({
    requestId: 'r-step',
    result: { ok: true, ran: { click: 'save' } },
  });
});

test('a failed step is answered with its error', async () => {
  running = setup();
  running.onStep.mockImplementation(async () => {
    throw new Error('Block "save" is not on page "ticket".');
  });
  running.stream.send('step-request', { requestId: 'r-fail', step: { click: 'save' } });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  expect(posts(running.fetch, '')[0].result).toEqual({
    error: 'Block "save" is not on page "ticket".',
  });
});

test('an inject request fakes the next device result and posts what was queued', async () => {
  running = setup();
  running.stream.send('inject', {
    requestId: 'r-inject',
    inject: { kind: 'scan', value: { data: 'JOB-42', type: 'qr' } },
  });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  expect(running.onInject).toHaveBeenCalledWith({
    injection: { kind: 'scan', value: { data: 'JOB-42', type: 'qr' } },
  });
  expect(posts(running.fetch, '')[0]).toEqual({
    requestId: 'r-inject',
    result: { ok: true, kind: 'scan', pending: 1 },
  });
});

test('a refused injection is answered with why', async () => {
  running = setup();
  running.onInject.mockImplementation(() => {
    throw new Error('A scan injection needs { data }. Received "JOB-42".');
  });
  running.stream.send('inject', { requestId: 'r-bad', inject: { kind: 'scan', value: 'JOB-42' } });
  await waitFor(() => expect(posts(running.fetch, '')).toHaveLength(1));
  expect(posts(running.fetch, '')[0].result).toEqual({
    error: 'A scan injection needs { data }. Received "JOB-42".',
  });
});

test('without a readable stream the shell polls every interval, as a passive caller', async () => {
  const pollEvents = [
    { event: 'tab', data: JSON.stringify({ tabId: 'phone' }) },
    { event: 'reload', data: '{}' },
  ];
  running = setup({
    pollEvents,
    streamFetch: jest.fn(async () => ({ ok: true, body: null })),
  });
  await waitFor(() => expect(running.onReload).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(posts(running.fetch, '/page')).toHaveLength(1));
  const polls = running.fetch.mock.calls.filter(([url]) => url.includes('transport=poll'));
  expect(polls[0][0]).toBe(`${apiBase}/api/reload?transport=poll&client=${DEV_CLIENT_MARKER}`);
  expect(polls[0][1].headers).toEqual({ 'x-lowdefy-passive': '1' });
  await waitFor(() =>
    expect(running.fetch.mock.calls.some(([url]) => url.endsWith('&tabId=phone'))).toBe(true)
  );
});
