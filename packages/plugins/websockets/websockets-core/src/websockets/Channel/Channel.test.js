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

import Channel from './Channel.js';

test('Channel resolves when the signal aborts', async () => {
  const controller = new AbortController();
  let resolved = false;
  const promise = Channel({ signal: controller.signal }).then(() => {
    resolved = true;
  });

  // The channel stays open until the last subscriber leaves.
  await Promise.resolve();
  expect(resolved).toBe(false);

  controller.abort();
  await promise;
  expect(resolved).toBe(true);
});

test('Channel resolves immediately when the signal is already aborted', async () => {
  const controller = new AbortController();
  controller.abort();

  await expect(Channel({ signal: controller.signal })).resolves.toBeUndefined();
});

test('Channel allows publishing', () => {
  expect(Channel.meta.publish).toBe(true);
});

test('Channel has a schema', () => {
  expect(Channel.schema).toBeDefined();
});
