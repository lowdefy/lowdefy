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

import fs from 'fs';
import os from 'os';
import path from 'path';

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
const mockCaptureAnnotatedScreenshot = jest.fn(async () => ({
  path: '.lowdefy/annotations/test.png',
}));
jest.unstable_mockModule('../../lib/docs/captureAnnotatedScreenshot.js', () => ({
  default: mockCaptureAnnotatedScreenshot,
}));

const { default: feedbackHandler } = await import('./feedback.js');

function createApp() {
  const app = new Hono();
  app.all('/api/feedback', feedbackHandler);
  return app;
}

let configDirectory;
const originalConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-feedback-test-'));
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
});

afterEach(() => {
  mockEnrichFeedback.mockClear();
  mockCaptureAnnotatedScreenshot.mockClear();
  fs.rmSync(configDirectory, { recursive: true, force: true });
  if (originalConfigDirectory === undefined) {
    delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  } else {
    process.env.LOWDEFY_DIRECTORY_CONFIG = originalConfigDirectory;
  }
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

// A real 1x1 red PNG so the saved file is a valid image, not just bytes.
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('feedbackHandler saves a tab-captured screenshot and skips the headless capture', async () => {
  const batch = {
    pageId: 'dashboard',
    annotations: [{ id: '1', kind: 'region', comment: 'x' }],
    screenshot: `data:image/png;base64,${PNG_1X1_BASE64}`,
  };
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
  expect(body.formatted).toContain('.lowdefy/annotations/dashboard-');
  // The data URL must never leak into the agent-readable text.
  expect(body.formatted).not.toContain(PNG_1X1_BASE64);
  expect(mockCaptureAnnotatedScreenshot).not.toHaveBeenCalled();

  const dir = path.join(configDirectory, '.lowdefy', 'annotations');
  const files = fs.readdirSync(dir);
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/^dashboard-.*\.png$/);
  expect(fs.readFileSync(path.join(dir, files[0]))).toEqual(
    Buffer.from(PNG_1X1_BASE64, 'base64')
  );
});

test('feedbackHandler falls back to the headless capture when the screenshot is not a PNG data URL', async () => {
  const batch = {
    pageId: 'dashboard',
    annotations: [{ id: '1', kind: 'region', comment: 'x' }],
    screenshot: 'data:image/jpeg;base64,notpng',
  };
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
  // Not a valid tab capture — no file saved, and no screenshotPath claimed
  // for it (the invalid-string branch logs a warning instead).
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'annotations'))).toBe(false);
});

test('feedbackHandler uses the headless capture when the batch has no screenshot', async () => {
  const batch = {
    pageId: 'dashboard',
    annotations: [{ id: '1', kind: 'region', comment: 'x' }],
  };
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
  expect(body.formatted).toContain('.lowdefy/annotations/dashboard-');
  expect(mockCaptureAnnotatedScreenshot).toHaveBeenCalledTimes(1);
});
