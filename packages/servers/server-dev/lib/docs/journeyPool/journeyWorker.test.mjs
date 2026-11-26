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

import { afterAll, expect, test, vi } from 'vitest';

import createJourneyPool from './createJourneyPool.js';

vi.setConfig({ testTimeout: 60000 });

// The pool with the real journeyWorker.js: a thread imports the server code in plain Node, as on
// the dev server, so an import only Vite could load would fail here.
const pool = createJourneyPool({ size: 1, readSignature: () => 'a' });

afterAll(async () => {
  await pool.close();
});

test('a journey thread loads the server code in plain Node and answers a journey it refuses', async () => {
  const answer = await pool.run({
    params: { origin: 'http://localhost:3227', pageId: 'home', steps: [{ dance: 'now' }] },
    mutant: null,
    host: {},
  });
  expect(answer.mutant).toBeNull();
  expect(answer.result.error).toMatch(/dance/);
  expect(pool.started).toBe(1);
});
