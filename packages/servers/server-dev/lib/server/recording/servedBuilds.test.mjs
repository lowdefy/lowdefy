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

import servedBuilds from './servedBuilds.js';

function buildId(index) {
  return new Date(Date.UTC(2026, 9, 3, 0, index)).toISOString();
}

test('servedBuilds ignores null and non-string ids', () => {
  servedBuilds.add(null);
  servedBuilds.add(undefined);
  servedBuilds.add(42);
  expect(servedBuilds.has(null)).toBe(false);
  expect(servedBuilds.has(undefined)).toBe(false);
  expect(servedBuilds.has(42)).toBe(false);
});

test('servedBuilds keeps the newest 100 build ids, re-serving one keeps it', () => {
  for (let index = 0; index < 100; index += 1) {
    servedBuilds.add(buildId(index));
  }
  servedBuilds.add(buildId(0));
  servedBuilds.add(buildId(100));
  expect(servedBuilds.has(buildId(0))).toBe(true);
  expect(servedBuilds.has(buildId(1))).toBe(false);
  expect(servedBuilds.has(buildId(2))).toBe(true);
  expect(servedBuilds.has(buildId(100))).toBe(true);
});
