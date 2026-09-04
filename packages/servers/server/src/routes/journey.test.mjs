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

const mockLogJourneyBatch = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  logJourneyBatch: mockLogJourneyBatch,
}));

jest.unstable_mockModule('../../lib/build/logger.js', () => ({
  default: { journeys: { enabled: true, sample_rate: 0.05 } },
}));

const { default: journeyHandler } = await import('./journey.js');

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger: { debug: jest.fn(), info: jest.fn() } });
    await next();
  });
  app.all('/api/journey', journeyHandler);
  return app;
}

const batch = { events: [{ block_id: 'b', event_name: 'onClick', page_id: 'p' }] };

function post({ headers = { host: 'app.test', origin: 'https://app.test' } } = {}) {
  return createApp().request('/api/journey', {
    body: JSON.stringify(batch),
    headers: { 'Content-Type': 'application/json', ...headers },
    method: 'POST',
  });
}

afterEach(() => {
  mockLogJourneyBatch.mockReset();
});

test('journeyHandler answers 204 and hands the batch and the app journeys policy to the api', async () => {
  mockLogJourneyBatch.mockResolvedValue({ logged: 1, status: 'ok' });
  const res = await post();

  expect(res.status).toEqual(204);
  expect(mockLogJourneyBatch.mock.calls[0][1]).toEqual({
    batch,
    journeys: { enabled: true, sample_rate: 0.05 },
  });
});

test('journeyHandler answers 204 when the app turned journeys off', async () => {
  mockLogJourneyBatch.mockResolvedValue({ logged: 0, status: 'disabled' });
  expect((await post()).status).toEqual(204);
});

test('journeyHandler answers 400 for a batch the api rejects', async () => {
  mockLogJourneyBatch.mockResolvedValue({ logged: 0, message: 'bad batch', status: 'invalid' });
  const res = await post();

  expect(res.status).toEqual(400);
  expect(await res.json()).toEqual({ error: 'bad batch' });
});

test.each([
  ['a cross-origin post', { host: 'app.test', origin: 'https://evil.test' }],
  ['a post with no origin', { host: 'app.test' }],
  ['a post with an unparsable origin', { host: 'app.test', origin: 'not a url' }],
])('journeyHandler answers 403 to %s and logs nothing', async (_, headers) => {
  const res = await post({ headers });

  expect(res.status).toEqual(403);
  expect(mockLogJourneyBatch).not.toHaveBeenCalled();
});

test('journeyHandler answers 405 to a GET rather than raising a fault', async () => {
  const res = await createApp().request('/api/journey', { method: 'GET' });

  expect(res.status).toEqual(405);
  expect(mockLogJourneyBatch).not.toHaveBeenCalled();
});
