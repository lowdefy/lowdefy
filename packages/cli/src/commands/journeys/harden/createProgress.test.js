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

import createProgress from './createProgress.js';
import { expect, test } from 'vitest';

const format = ({ done, total }) => `${done}/${total}`;

test('logs every N units and always the last', () => {
  const lines = [];
  const tick = createProgress({
    total: 7,
    format,
    log: (l) => lines.push(l),
    everyCount: 3,
    now: () => 0,
  });
  for (let i = 0; i < 7; i += 1) tick();
  expect(lines).toEqual(['3/7', '6/7', '7/7']);
});

test('logs when the interval has passed, however few units finished', () => {
  const lines = [];
  let time = 0;
  const tick = createProgress({
    total: 100,
    format,
    log: (l) => lines.push(l),
    everyCount: 50,
    everyMs: 15000,
    now: () => time,
  });
  tick();
  time = 14999;
  tick();
  expect(lines).toEqual([]);
  time = 15000;
  tick();
  expect(lines).toEqual(['3/100']);
  time = 20000;
  tick();
  expect(lines).toEqual(['3/100']);
});

test('passes detail to the formatter', () => {
  const lines = [];
  const tick = createProgress({
    total: 1,
    format: ({ done, failed }) => `${done} ${failed}`,
    log: (l) => lines.push(l),
  });
  tick({ failed: 2 });
  expect(lines).toEqual(['1 2']);
});
