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

import { expect, test } from 'vitest';

import runJourneyPool from './runJourneyPool.js';
import runRepeated from './runRepeated.js';

function entry(name) {
  return {
    item: { filePath: `${name}.yaml`, journey: { name, pageId: 'form', data: 'base', steps: [] } },
    usage: { tier: null },
  };
}

const recording = { run: 'run-1', paths: [], filter: [], tags: [], tier: 'full' };

test('runRepeated records the first repetition of a full-suite run', async () => {
  const calls = [];
  const suite = {
    run: async ({ recordRun }) => {
      calls.push(recordRun);
      return { passed: true, durationMs: 10 };
    },
  };
  const result = await runRepeated({
    suite,
    item: entry('a').item,
    repeat: 1,
    recording,
  });
  expect(calls).toEqual(['run-1']);
  expect(result.recorded).toEqual({ run: 'run-1', passed: true });
});

test('runRepeated records nothing without a recording', async () => {
  const calls = [];
  const suite = {
    run: async ({ recordRun }) => {
      calls.push(recordRun);
      return { passed: true, durationMs: 10 };
    },
  };
  const result = await runRepeated({ suite, item: entry('a').item, repeat: 1 });
  expect(calls).toEqual([undefined]);
  expect(result.recorded).toBeUndefined();
});

// As lowdefy test and lowdefy_run_tests wire them: a contended failure's rerun passes no
// recording, so the dev server writes one set of records for the journey, not two.
test('a contended journey in a full-suite run records once, and keeps its first attempt failed', async () => {
  const recordRuns = [];
  let attemptsOfA = 0;
  const suite = {
    run: async ({ item, recordRun }) => {
      const name = item.journey.name;
      recordRuns.push({ name, recordRun });
      await new Promise((resolve) => setImmediate(resolve));
      if (name === 'a') {
        attemptsOfA += 1;
        if (attemptsOfA === 1) {
          return { name, passed: false, durationMs: 10, message: 'The page did not open.' };
        }
      }
      return { name, passed: true, durationMs: 10 };
    },
  };
  const results = await runJourneyPool({
    entries: [entry('a'), entry('b')],
    readLimit: () => 2,
    run: async ({ item, usage }, { rerun }) => ({
      ...(await runRepeated({
        suite,
        item,
        repeat: 1,
        recording: rerun ? undefined : recording,
      })),
      usage,
    }),
  });
  expect(recordRuns).toEqual([
    { name: 'a', recordRun: 'run-1' },
    { name: 'b', recordRun: 'run-1' },
    { name: 'a', recordRun: undefined },
  ]);
  expect(results[0]).toMatchObject({
    class: 'PASS',
    contended: true,
    contendedFailure: { message: 'The page did not open.' },
    recorded: { run: 'run-1', passed: false },
  });
});
