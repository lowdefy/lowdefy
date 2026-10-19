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

import createBuildActivity from './createBuildActivity.mjs';

test('waitForIdle waits for tracked work to finish and reports that it saw a build', async () => {
  const onChange = jest.fn();
  const activity = createBuildActivity({ onChange });
  let finish;
  const work = activity.track(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const waiting = activity.waitForIdle({ graceMs: 100, intervalMs: 10 });
  await new Promise((resolve) => setTimeout(resolve, 150));
  finish('done');

  await expect(work).resolves.toBe('done');
  await expect(waiting).resolves.toMatchObject({ settled: true, sawBuild: true });
  expect(onChange.mock.calls).toEqual([[true], [false]]);
});

test('waitForIdle stays busy while overlapping work remains', async () => {
  const activity = createBuildActivity({ onChange: () => {} });
  activity.setBusy(true);
  activity.setBusy(true);
  activity.setBusy(false);

  await expect(
    activity.waitForIdle({ graceMs: 10, timeoutMs: 100, intervalMs: 10 })
  ).resolves.toMatchObject({ settled: false, sawBuild: true });
});

test('waitForIdle returns after the grace window when nothing starts', async () => {
  const activity = createBuildActivity({ onChange: () => {} });

  await expect(activity.waitForIdle({ graceMs: 30, intervalMs: 10 })).resolves.toMatchObject({
    settled: true,
    sawBuild: false,
  });
});
