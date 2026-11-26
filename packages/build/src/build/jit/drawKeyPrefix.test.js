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

import { expect, test, vi } from 'vitest';

const draws = [];
vi.doMock('crypto', () => ({
  randomBytes: () => Buffer.from(draws.shift(), 'hex'),
}));

const { default: drawKeyPrefix } = await import('./drawKeyPrefix.js');

test('drawKeyPrefix draws again when the random bytes give a prefix it drew before', () => {
  draws.push('ab12', 'ab12', 'cd34', 'ab12', 'cd34', 'ef56');
  expect(drawKeyPrefix()).toBe('ab12_');
  expect(drawKeyPrefix()).toBe('cd34_');
  expect(drawKeyPrefix()).toBe('ef56_');
  expect(draws).toEqual([]);
});
