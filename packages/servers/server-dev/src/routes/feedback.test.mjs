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

// enrichFeedback (findConfig → force-builds a page) is covered on its own in
// lib/docs/formatFeedback.test.mjs — here it's stubbed as a pass-through so
// this file only exercises the route: origin check, validation, and enrich +
// format wiring.
const mockEnrichFeedback = jest.fn(async ({ batch }) => batch);
jest.unstable_mockModule('../../lib/docs/enrichFeedback.js', () => ({
  default: mockEnrichFeedback,
}));
jest.unstable_mockModule('../../lib/docs/captureAnnotatedScreenshot.js', () => ({
  default: jest.fn(async () => ({ path: '.lowdefy/annotations/test.png' })),
}));

const { default: feedbackHandler } = await import('./feedback.js');

function createApp() {
  const app = new Hono();
  app.all('/api/feedback', feedbackHandler);
  return app;
}

afterEach(() => {
  mockEnrichFeedback.mockClear();
});

test('feedbackHandler returns 403 when the Origin header is missing', async () => {
  const res = await createApp().request('/api/feedback', {
    method: 'POST',
    headers: { host: 'localhost:3001', 'content-type': 'application/json' },
    body: JSON.stringify({ annotations: [] }),
  });
  expect(res.status).toEqual(403);
});

test('feedbackHandler returns 403 when the Origin host does not match the request host', async () => {
  const res = await createApp().request('/api/feedback', {
    method: 'POST',
    headers: {
      host: 'localhost:3001',
      origin: 'http://evil.example.com',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ annotations: [] }),
  });
  expect(res.status).toEqual(403);
});

test('feedbackHandler returns 400 with a helpful message when annotations is missing', async () => {
  const res = await createApp().request('/api/feedback', {
    method: 'POST',
    headers: {
      host: 'localhost:3001',
      origin: 'http://localhost:3001',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ pageId: 'login' }),
  });
  expect(res.status).toEqual(400);
  const body = await res.json();
  expect(body.error).toMatch(/annotations/);
  expect(body.error).toMatch(/\/lowdefy-docs/);
});

test('feedbackHandler enriches a valid batch and returns the formatted text', async () => {
  const batch = { pageId: 'login', annotations: [{ id: '1', kind: 'region', comment: 'x' }] };
  const res = await createApp().request('/api/feedback', {
    method: 'POST',
    headers: {
      host: 'localhost:3001',
      origin: 'http://localhost:3001',
      'content-type': 'application/json',
    },
    body: JSON.stringify(batch),
  });

  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(typeof body.formatted).toBe('string');
  expect(body.formatted).toContain('login');
  expect(mockEnrichFeedback).toHaveBeenCalledWith({ batch });
});
