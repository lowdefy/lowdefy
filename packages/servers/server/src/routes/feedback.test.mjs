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

import { Hono } from 'hono';
import { jest } from '@jest/globals';

const mockLogFeedbackReport = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  logFeedbackReport: mockLogFeedbackReport,
}));

jest.unstable_mockModule('../../lib/build/config.js', () => ({
  default: { feedback: { enabled: true, roles: ['support'] } },
}));

const { default: feedbackHandler } = await import('./feedback.js');

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger: { debug: jest.fn(), info: jest.fn() } });
    await next();
  });
  app.all('/api/feedback', feedbackHandler);
  return app;
}

const report = {
  text: 'The save button does nothing.',
  page_id: 'orders',
  session_id: 'sess-1',
  url: 'https://app.test/orders',
};

function post({ headers = { host: 'app.test', origin: 'https://app.test' } } = {}) {
  return createApp().request('/api/feedback', {
    body: JSON.stringify(report),
    headers: { 'Content-Type': 'application/json', ...headers },
    method: 'POST',
  });
}

afterEach(() => {
  mockLogFeedbackReport.mockReset();
});

test('feedbackHandler answers 204 and hands the report and the app feedback policy to the api', async () => {
  mockLogFeedbackReport.mockReturnValue({ status: 'ok' });
  const res = await post();

  expect(res.status).toEqual(204);
  expect(mockLogFeedbackReport.mock.calls[0][1]).toEqual({
    feedback: { enabled: true, roles: ['support'] },
    report,
  });
});

test.each([
  ['the app has feedback turned off', 'disabled'],
  ['the caller is not authorized', 'forbidden'],
])('feedbackHandler answers 403 when %s', async (_, status) => {
  mockLogFeedbackReport.mockReturnValue({ status });
  const res = await post();

  expect(res.status).toEqual(403);
  expect(await res.json()).toEqual({ error: 'Forbidden' });
});

test('feedbackHandler answers 400 for a report the api rejects', async () => {
  mockLogFeedbackReport.mockReturnValue({ message: 'bad report', status: 'invalid' });
  const res = await post();

  expect(res.status).toEqual(400);
  expect(await res.json()).toEqual({ error: 'bad report' });
});

test.each([
  ['a cross-origin post', { host: 'app.test', origin: 'https://evil.test' }],
  ['a post with no origin', { host: 'app.test' }],
  ['a post with an unparsable origin', { host: 'app.test', origin: 'not a url' }],
  [
    'a post a browser marked cross-site',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'cross-site' },
  ],
])('feedbackHandler answers 403 to %s and logs nothing', async (_, headers) => {
  const res = await post({ headers });

  expect(res.status).toEqual(403);
  expect(mockLogFeedbackReport).not.toHaveBeenCalled();
});

test('feedbackHandler answers 405 to a GET rather than raising a fault', async () => {
  const res = await createApp().request('/api/feedback', { method: 'GET' });

  expect(res.status).toEqual(405);
  expect(mockLogFeedbackReport).not.toHaveBeenCalled();
});

test('feedbackHandler accepts a post a browser marked same-origin', async () => {
  mockLogFeedbackReport.mockReturnValue({ status: 'ok' });
  const res = await post({
    headers: { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'same-origin' },
  });

  expect(res.status).toEqual(204);
});
