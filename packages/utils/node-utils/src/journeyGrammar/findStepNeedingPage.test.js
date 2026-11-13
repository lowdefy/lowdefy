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

import findStepNeedingPage from './findStepNeedingPage.js';

test('findStepNeedingPage returns undefined when every step runs without a page', () => {
  expect(
    findStepNeedingPage({
      steps: [
        { call: { endpoint: 'e' } },
        { expect: { status: 403 } },
        { expect: { error: 'x' } },
        { request: { pageId: 'p', requestId: 'r', as: 'none' } },
        { as: 'other' },
        { wait: 100 },
        { wait: { ms: 100 } },
        { expect: { calls: { endpoint: 'e', count: 1 } } },
        { expect: { calls: { request: 'r', pageId: 'p', count: 1 } } },
        { expect: { db: { collection: 'c', match: {}, count: 0 } } },
      ],
    })
  ).toBeUndefined();
});

test.each([
  [{ click: 'save' }],
  [{ goto: 'home' }],
  [{ wait: { request: 'r' } }],
  [{ wait: { state: 'loaded' } }],
  [{ screenshot: true }],
  [{ expect: { visible: 'save' } }],
  [{ expect: { state: { path: 'a', equals: 1 } } }],
  [{ expect: { url: { contains: '/' } } }],
  [{ expect: { calls: { request: 'r', count: 1 } } }],
])('findStepNeedingPage finds %j', (step) => {
  expect(findStepNeedingPage({ steps: [{ call: { endpoint: 'e' } }, step] })).toEqual({
    index: 1,
    step,
  });
});
