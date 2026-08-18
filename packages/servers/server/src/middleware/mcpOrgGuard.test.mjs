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

import mcpOrgGuard from './mcpOrgGuard.js';

function createApp() {
  const downstream = jest.fn((c) => c.json({ reached: true }));
  const app = new Hono();
  app.use('/api/mcp/:org', mcpOrgGuard);
  app.all('/api/mcp/:org', downstream);
  return { app, downstream };
}

test('mcpOrgGuard returns 404 for a malformed org segment before any downstream work', async () => {
  const { app, downstream } = createApp();
  const res = await app.request('/api/mcp/a%20b', { method: 'POST' });
  expect(res.status).toEqual(404);
  expect(await res.json()).toEqual({ error: 'Not found.' });
  expect(downstream).not.toHaveBeenCalled();
});

test('mcpOrgGuard passes a well-formed org segment through', async () => {
  const { app, downstream } = createApp();
  const res = await app.request('/api/mcp/org_8f2k1x', { method: 'POST' });
  expect(res.status).toEqual(200);
  expect(await res.json()).toEqual({ reached: true });
  expect(downstream).toHaveBeenCalled();
});
