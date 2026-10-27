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

import createBacklog from './createBacklog.js';
import createNetworkError from '../../test/createNetworkError.js';

function memoryKv() {
  const values = new Map();
  return { get: (key) => values.get(key) ?? null, set: (key, value) => values.set(key, value) };
}

test('a backlog sends its posts oldest first and keeps the rest after a failure', async () => {
  const backlog = createBacklog({ key: 'k', kv: memoryKv() });
  backlog.add({ endpointId: 'a', payload: 1 });
  backlog.add({ endpointId: 'a', payload: 2 });
  backlog.add({ endpointId: 'a', payload: 3 });
  const sent = [];
  const count = await backlog.flush(async (entry) => {
    if (entry.payload === 2) throw createNetworkError();
    sent.push(entry.payload);
  });
  expect(count).toBe(1);
  expect(sent).toEqual([1]);
  expect(backlog.size()).toBe(2);
});

test('a post added while the backlog flushes is kept', async () => {
  const backlog = createBacklog({ key: 'k', kv: memoryKv() });
  backlog.add({ endpointId: 'a', payload: 1 });
  await backlog.flush(async () => {
    backlog.add({ endpointId: 'a', payload: 2 });
  });
  expect(backlog.size()).toBe(1);
});
