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

import expectTerminates from './expectTerminates.js';

test('passes the resolved value through when the promise settles in time', async () => {
  const result = await expectTerminates(Promise.resolve(42), 1000, 'should not fire');
  expect(result).toBe(42);
});

test('passes the rejection through when the promise rejects in time', async () => {
  await expect(
    expectTerminates(Promise.reject(new Error('real failure')), 1000, 'should not fire')
  ).rejects.toThrow('real failure');
});

test('rejects with the hint when the promise does not settle within ms', async () => {
  const never = new Promise(() => {});
  await expect(
    expectTerminates(never, 20, 'suspected cycle-detection regression')
  ).rejects.toThrow('promise did not settle within 20ms — suspected cycle-detection regression');
});
