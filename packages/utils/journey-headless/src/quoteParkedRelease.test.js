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

import quoteParkedRelease from './quoteParkedRelease.js';

test('quoteParkedRelease quotes a release that is its call alone', () => {
  expect(quoteParkedRelease({ release: 'release: claim' })).toBe('"release: claim"');
});

test('quoteParkedRelease names the hold after a release another parked call shares', () => {
  expect(
    quoteParkedRelease({
      release: 'release: { requestId: claim, pageId: new-claim }',
      hold: 'the hold at step 1: the 2nd such release lets it go',
    })
  ).toBe(
    '"release: { requestId: claim, pageId: new-claim }" (the hold at step 1: the 2nd such release lets it go)'
  );
});
