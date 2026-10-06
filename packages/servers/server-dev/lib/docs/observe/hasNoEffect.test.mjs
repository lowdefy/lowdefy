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

import hasNoEffect from './hasNoEffect.js';

const url = 'http://localhost:3227/explore';

function windowWith(overrides) {
  return { emits: [], mutationCount: 0, requests: [], urlBefore: url, urlAfter: url, ...overrides };
}

test('hasNoEffect is true when the window holds no event, DOM change, app request or URL change', () => {
  expect(hasNoEffect({ window: windowWith({}) })).toBe(true);
});

test.each([
  ['an event', { emits: [{ blockId: 'save', eventName: 'onClick', success: true }] }],
  ['a DOM change', { mutationCount: 2 }],
  ['a replaced document', { mutationCount: null }],
  ['an app request', { requests: [{ url: 'http://localhost:3227/api/request/explore/load' }] }],
  ['a URL change', { urlAfter: 'http://localhost:3227/second' }],
])('hasNoEffect is false when the window holds %s', (_, overrides) => {
  expect(hasNoEffect({ window: windowWith(overrides) })).toBe(false);
});
