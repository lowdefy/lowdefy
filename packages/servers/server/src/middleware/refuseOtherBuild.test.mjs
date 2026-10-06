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

import refuseOtherBuild from './refuseOtherBuild.js';

function createApp() {
  const handler = jest.fn((c) => c.json({ ran: true }));
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', { logger: { info: jest.fn() } });
    await next();
  });
  app.post('/api/request/home/save', refuseOtherBuild({ buildId: 'build-2' }), handler);
  return { app, handler };
}

test('refuseOtherBuild refuses a call from another build with 409 before the handler runs', async () => {
  const { app, handler } = createApp();
  const res = await app.request('/api/request/home/save', {
    method: 'POST',
    headers: { 'x-lowdefy-build': 'build-1' },
  });
  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({
    name: 'UserError',
    message: 'This page is from an earlier version of the app. Reload the page to continue.',
    buildId: 'build-2',
  });
  expect(handler).not.toHaveBeenCalled();
});

test('refuseOtherBuild runs a call from the same build', async () => {
  const { app, handler } = createApp();
  const res = await app.request('/api/request/home/save', {
    method: 'POST',
    headers: { 'x-lowdefy-build': 'build-2' },
  });
  expect(res.status).toBe(200);
  expect(handler).toHaveBeenCalledTimes(1);
});

test('refuseOtherBuild runs a call that names no build', async () => {
  const { app, handler } = createApp();
  const res = await app.request('/api/request/home/save', { method: 'POST' });
  expect(res.status).toBe(200);
  expect(handler).toHaveBeenCalledTimes(1);
});
