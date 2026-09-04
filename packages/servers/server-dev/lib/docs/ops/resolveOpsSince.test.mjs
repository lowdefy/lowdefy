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

import resolveOpsSince from './resolveOpsSince.js';

// Two cold starts of the current deploy and one of the previous one: "since
// the deploy" is the FIRST process_started carrying the newest git_sha, not
// the newest line.
const processStarts = [
  { _time: '2026-08-30T09:00:00.000Z', event: 'process_started', git_sha: 'sha-old' },
  { _time: '2026-09-01T09:00:00.000Z', event: 'process_started', git_sha: 'sha-new' },
  { _time: '2026-09-01T11:30:00.000Z', event: 'process_started', git_sha: 'sha-new' },
];

function createAdapter(rows) {
  return {
    query: jest.fn(async ({ where = [], order, limit }) => {
      const matched = rows.filter((row) => where.every(([field, , value]) => row[field] === value));
      matched.sort((a, b) =>
        order === 'desc' ? b._time.localeCompare(a._time) : a._time.localeCompare(b._time)
      );
      return matched.slice(0, limit);
    }),
  };
}

test('resolveOpsSince passes an ISO timestamp straight through', async () => {
  const adapter = createAdapter(processStarts);
  await expect(resolveOpsSince({ adapter, since: '2026-09-01T00:00:00.000Z' })).resolves.toEqual({
    since: '2026-09-01T00:00:00.000Z',
    git_sha: null,
  });
  expect(adapter.query).not.toHaveBeenCalled();
});

test('resolveOpsSince resolves "deploy" to the first process_started of the newest git_sha', async () => {
  const adapter = createAdapter(processStarts);
  await expect(resolveOpsSince({ adapter, since: 'deploy' })).resolves.toEqual({
    since: '2026-09-01T09:00:00.000Z',
    git_sha: 'sha-new',
  });
});

test('resolveOpsSince searches the whole window and says so when no deploy marker exists', async () => {
  const result = await resolveOpsSince({ adapter: createAdapter([]), since: 'deploy' });
  expect(result.since).toBeNull();
  expect(result.git_sha).toBeNull();
  expect(result.note).toContain('No process_started event');
});

test('resolveOpsSince treats an omitted since as the whole retention window', async () => {
  await expect(resolveOpsSince({ adapter: createAdapter(processStarts) })).resolves.toEqual({
    since: null,
    git_sha: null,
  });
});
