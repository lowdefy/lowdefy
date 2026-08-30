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

import validateJourneySteps from './validateJourneySteps.js';

test('validateJourneySteps accepts every step of the grammar', () => {
  const result = validateJourneySteps({
    steps: [
      { click: 'submit' },
      { fill: { blockId: 'name', value: 'Ada' } },
      { fill: { blockId: 'age', value: 0 } },
      { select: { blockId: 'country', value: 'Chile' } },
      { press: 'Mod+k' },
      { wait: { ms: 100 } },
      { wait: { request: 'get_rows' } },
      { wait: { state: 'rows' } },
      { screenshot: 'after' },
      { screenshot: true },
      { screenshot: null },
      { expect: { state: { path: 'saved', equals: true } } },
      { expect: { state: { path: 'missing', equals: null } } },
      { expect: { visible: 'modal' } },
      { expect: { text: { blockId: 'title', contains: 'Hello' } } },
      { expect: { url: { contains: '/detail' } } },
    ],
  });
  expect(result).toEqual({});
});

test('validateJourneySteps rejects steps that are not an array', () => {
  expect(validateJourneySteps({ steps: undefined }).error).toMatch(
    /requires "steps" to be an array. Received undefined/
  );
  expect(validateJourneySteps({ steps: 'click' }).error).toMatch(/Received "click"/);
});

test('validateJourneySteps names the index and key of an unknown step', () => {
  const result = validateJourneySteps({ steps: [{ click: 'a' }, { hover: 'b' }] });
  expect(result.error).toEqual(
    'Step 1: Unknown journey step "hover". Steps are: click, fill, select, press, wait, screenshot, expect.'
  );
});

test('validateJourneySteps rejects a step with more than one key', () => {
  const result = validateJourneySteps({ steps: [{ click: 'a', fill: { blockId: 'b' } }] });
  expect(result.error).toEqual(
    'Step 0: Unknown journey step "click, fill". Steps are: click, fill, select, press, wait, screenshot, expect.'
  );
});

test('validateJourneySteps rejects a step that is not an object', () => {
  expect(validateJourneySteps({ steps: ['click submit'] }).error).toMatch(
    /Step 0: Journey steps must be objects with one key. Received "click submit"/
  );
});

test.each([
  [{ click: 7 }, /Step "click" requires a blockId string. Received 7/],
  [{ fill: 'name' }, /Step "fill" requires \{ blockId, value \}/],
  [{ fill: { blockId: 1, value: 'x' } }, /Step "fill" requires a "blockId" string. Received 1/],
  [{ fill: { blockId: 'name' } }, /Step "fill" requires a "value"/],
  [{ select: { value: 'x' } }, /Step "select" requires a "blockId" string/],
  [{ press: ['Enter'] }, /Step "press" requires a key string/],
  [{ wait: 100 }, /Step "wait" requires one of \{ ms \}, \{ request \}, \{ state \}/],
  [
    { wait: { ms: 1, request: 'r' } },
    /Step "wait" requires exactly one of "ms", "request", "state"/,
  ],
  [{ wait: { until: 'x' } }, /Step "wait" requires exactly one of/],
  [{ wait: { ms: '100' } }, /Step "wait" requires "ms" to be a number. Received "100"/],
  [{ wait: { request: 1 } }, /Step "wait" requires "request" to be a string. Received 1/],
  [{ screenshot: 3 }, /Step "screenshot" takes an optional name string. Received 3/],
  [
    { expect: 'visible' },
    /Step "expect" requires one of \{ state \}, \{ visible \}, \{ text \}, \{ url \}/,
  ],
  [
    { expect: { count: 1 } },
    /Step "expect" requires exactly one of "state", "visible", "text", "url"/,
  ],
  [{ expect: { state: { path: 'a' } } }, /Step "expect.state" requires \{ path, equals \}/],
  [{ expect: { state: 'a' } }, /Step "expect.state" requires \{ path, equals \}/],
  [{ expect: { visible: { blockId: 'a' } } }, /Step "expect.visible" requires a blockId string/],
  [{ expect: { text: { blockId: 'a' } } }, /Step "expect.text" requires \{ blockId, contains \}/],
  [{ expect: { url: '/detail' } }, /Step "expect.url" requires \{ contains \}/],
])('validateJourneySteps rejects malformed step %j', (step, expected) => {
  const result = validateJourneySteps({ steps: [step] });
  expect(result.error).toMatch(/^Step 0: /);
  expect(result.error).toMatch(expected);
});
