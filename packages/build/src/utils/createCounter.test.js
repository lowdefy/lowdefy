/*
  Copyright 2020-2024 Lowdefy, Inc

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

import createCounter from './createCounter.js';

test('counter', async () => {
  const counter = createCounter();
  expect(counter.getCount('a')).toBe(0);
  counter.increment('a');
  expect(counter.getCount('a')).toBe(1);
  counter.increment('a');
  counter.increment('b');
  counter.increment('a');
  expect(counter.getCount('a')).toBe(3);
  expect(counter.getCount('b')).toBe(1);
  expect(counter.getCounts()).toEqual({ a: 3, b: 1 });
});
