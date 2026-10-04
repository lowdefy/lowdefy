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

import wait from './wait.js';

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
});

afterEach(() => {
  jest.useRealTimers();
});

test('wait resolves only once the set ms have passed', async () => {
  let flag = false;
  wait(10).then(() => {
    flag = true;
  });
  jest.advanceTimersByTime(9);
  await Promise.resolve();
  expect(flag).toBe(false);
  jest.advanceTimersByTime(1);
  await Promise.resolve();
  expect(flag).toBe(true);
});
