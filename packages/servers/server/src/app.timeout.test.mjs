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
import { vi, beforeEach, expect, test } from 'vitest';

// The real app wiring and error handler with a request route that outlives the request
// timeout: what a request a slow upstream holds past config.requestTimeout reports.
const REQUEST_TIMEOUT_MS = 50;

const captureException = vi.fn();
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
// How the slow request route answers, set by each test.
let lateAnswer;
// Settles once the handler and every middleware inside apiContext have run on the late answer.
let lateChain;

function handler(c) {
  return c.json({ ok: true });
}
// Answers well after the timeout.
async function slowHandler(c) {
  await new Promise((resolve) => setTimeout(resolve, REQUEST_TIMEOUT_MS * 3));
  return lateAnswer(c);
}
function largeHandler(c) {
  return c.json({ rows: 'x'.repeat(4096) });
}
function passThrough() {
  return (c, next) => next();
}

vi.doMock('./routes/agent.js', () => ({ default: handler }));
vi.doMock('./routes/apiPage.js', () => ({ default: largeHandler }));
vi.doMock('./routes/auth.js', () => ({ default: () => handler }));
vi.doMock('./routes/clientError.js', () => ({ default: handler }));
vi.doMock('./routes/cron.js', () => ({ default: handler }));
vi.doMock('./routes/cronForward.js', () => ({ default: handler }));
vi.doMock('./routes/detached.js', () => ({ default: handler }));
vi.doMock('./routes/endpoints.js', () => ({ default: handler }));
vi.doMock('./routes/mcp.js', () => ({ default: handler }));
vi.doMock('./routes/mobileRoot.js', () => ({ default: handler }));
vi.doMock('./routes/mountOauthDiscovery.js', () => ({ default: () => {} }));
vi.doMock('./routes/request.js', () => ({ default: slowHandler }));
vi.doMock('./routes/usage.js', () => ({ default: handler }));
vi.doMock('./routes/user.js', () => ({ default: handler }));
vi.doMock('./routes/websocket.js', () => ({ default: handler }));
vi.doMock('./routes/wellKnownFallback.js', () => ({ default: handler }));
vi.doMock('./html/renderPage.js', () => ({
  default: (c) => c.html('<html></html>'),
}));
// Production's context.handleError logs the fault and captures it to Sentry.
vi.doMock('./middleware/apiContext.js', () => ({
  default: () => (c, next) => {
    c.set('lowdefyContext', {
      logger,
      handleError: async (error) => {
        logger.error(error);
        captureException(error);
      },
    });
    lateChain = next();
    return lateChain;
  },
}));
vi.doMock('./middleware/sentry.js', () => ({ default: passThrough }));
vi.doMock('../lib/build/appMeta.js', () => ({ default: { buildId: 'build-1' } }));
vi.doMock('../lib/build/auth.js', () => ({ default: { configured: false } }));
vi.doMock('../lib/build/theme.js', () => ({ default: {} }));
vi.doMock('../lib/build/config.js', () => ({
  default: { requestTimeout: REQUEST_TIMEOUT_MS },
}));
vi.doMock('../lib/build/mobileConfig.js', () => ({ default: {} }));
vi.doMock('../lib/server/auth/getAuth.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/auth/getStrategies.js', () => ({ default: vi.fn() }));
vi.doMock('../lib/server/log/createLogger.js', () => ({ default: () => logger }));

const { default: sentrySdk } = await import('../lib/server/sentry/sentrySdk.js');
const { default: createApp } = await import('./app.js');

beforeEach(() => {
  vi.clearAllMocks();
  sentrySdk.current = { captureException };
});

async function requestPastTimeout() {
  const res = await createApp().request('/api/request/home/get_data', {
    method: 'POST',
    headers: { 'accept-encoding': 'gzip' },
  });
  expect(res.status).toEqual(504);
  // Sending the 504 reads its body, as the Node server does.
  expect(await res.text()).toEqual('');
  // The handler answers after the 504 went out, and the middleware around it finishes.
  await lateChain;
  // compress, outside apiContext, finishes on the next turn.
  await new Promise((resolve) => setImmediate(resolve));
}

test('a request whose handler answers after the timeout answers 504 and reports nothing', async () => {
  lateAnswer = (c) => c.json({ rows: 'x'.repeat(4096) });
  await requestPastTimeout();
  expect(captureException).not.toHaveBeenCalled();
  expect(logger.error).not.toHaveBeenCalled();
});

test('a handler that sets a header after the timeout reports nothing', async () => {
  lateAnswer = (c) => c.redirect('/home', 302);
  await requestPastTimeout();
  expect(captureException).not.toHaveBeenCalled();
  expect(logger.error).not.toHaveBeenCalled();
});

test('a handler that fails after the timeout is still reported', async () => {
  const fault = new Error('The upstream write failed.');
  lateAnswer = () => {
    throw fault;
  };
  await requestPastTimeout();
  expect(captureException).toHaveBeenCalledTimes(1);
  expect(captureException).toHaveBeenCalledWith(fault);
});

test('a response in time is still compressed', async () => {
  const res = await createApp().request('/api/page/home', {
    headers: { 'accept-encoding': 'gzip' },
  });
  expect(res.status).toEqual(200);
  expect(res.headers.get('content-encoding')).toEqual('gzip');
});
