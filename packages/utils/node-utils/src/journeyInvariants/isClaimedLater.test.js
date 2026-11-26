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

import isClaimedLater from './isClaimedLater.js';

test('isClaimedLater claims a call or a release by an expect.error among the expects after it', () => {
  const steps = [
    { hold: { requestId: 'claim' } },
    { call: { endpoint: 'approve' } },
    { expect: { status: 200 } },
    { expect: { error: 'held' } },
    { release: 'claim' },
    { expect: { status: 200 } },
    { expect: { error: 'already approved' } },
  ];
  expect(isClaimedLater({ index: 0, steps })).toBe(false);
  expect(isClaimedLater({ index: 1, steps })).toBe(true);
  expect(isClaimedLater({ index: 4, steps })).toBe(true);
});

test('isClaimedLater does not claim a release with no expect.error after it', () => {
  const steps = [{ hold: { requestId: 'claim' } }, { release: 'claim' }, { click: 'save' }];
  expect(isClaimedLater({ index: 1, steps })).toBe(false);
});
