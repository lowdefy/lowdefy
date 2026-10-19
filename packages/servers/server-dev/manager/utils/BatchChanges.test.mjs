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
import { wait } from '@lowdefy/helpers';

import BatchChanges from './BatchChanges.mjs';

const context = { logger: { error: jest.fn() } };

test('BatchChanges reports busy from the first change until the batch is processed', async () => {
  const events = [];
  const fn = jest.fn(async () => {
    events.push('processed');
  });
  const batch = new BatchChanges({
    context,
    fn,
    delay: 20,
    onBusy: (busy) => events.push(busy ? 'busy' : 'idle'),
  });
  batch.newChange('a.yaml');
  batch.newChange('b.yaml');
  expect(events).toEqual(['busy']);
  await wait(80);
  expect(events).toEqual(['busy', 'processed', 'idle']);
  expect(fn).toHaveBeenCalledWith([['a.yaml'], ['b.yaml']]);
});

test('BatchChanges stays busy through a change that arrives while a batch is running', async () => {
  const events = [];
  let batch;
  const fn = jest.fn(async (args) => {
    events.push(`processed ${args.flat().join(',')}`);
    if (args.flat().includes('a.yaml')) {
      batch.newChange('b.yaml');
      await wait(10);
    }
  });
  batch = new BatchChanges({
    context,
    fn,
    delay: 10,
    onBusy: (busy) => events.push(busy ? 'busy' : 'idle'),
  });
  batch.newChange('a.yaml');
  await wait(100);
  expect(events).toEqual(['busy', 'processed a.yaml', 'processed b.yaml', 'idle']);
});

test('BatchChanges clears busy when processing throws', async () => {
  const events = [];
  const batch = new BatchChanges({
    context,
    fn: async () => {
      throw new Error('build failed');
    },
    delay: 10,
    onBusy: (busy) => events.push(busy ? 'busy' : 'idle'),
  });
  batch.newChange('a.yaml');
  await wait(50);
  expect(events).toEqual(['busy', 'idle']);
});
