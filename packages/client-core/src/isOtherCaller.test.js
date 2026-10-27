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

import { callerHash, parseCallerStamp } from '@lowdefy/helpers';

import isOtherCaller from './isOtherCaller.js';
import { expect, test } from 'vitest';

const user = { id: 'user_1', organization_id: 'org_1', roles: ['editor'] };

function stampFor(header) {
  return parseCallerStamp(header);
}

test('isOtherCaller is false when the server answered as the rendered caller', () => {
  // The fixed vector callerStamp's own tests pin, so server and client agree.
  const stamp = stampFor(
    '82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b; memberships=476954726056d64d'
  );
  expect(isOtherCaller({ stamp, user })).toBe(false);
});

test('isOtherCaller is false for an anonymous page whose caller stays anonymous', () => {
  expect(isOtherCaller({ stamp: stampFor(''), user: null })).toBe(false);
});

test('isOtherCaller is true when the server answered as another person', () => {
  const stamp = stampFor(callerHash({ user: { id: 'user_2', organization_id: 'org_1' } }));
  expect(isOtherCaller({ stamp, user })).toBe(true);
});

test('isOtherCaller is true when the server answered in another organization', () => {
  const stamp = stampFor(callerHash({ user: { id: 'user_1', organization_id: 'org_2' } }));
  expect(isOtherCaller({ stamp, user })).toBe(true);
});

test('isOtherCaller is true when the server answered as nobody to a signed-in page', () => {
  expect(isOtherCaller({ stamp: stampFor(''), user })).toBe(true);
});

test('isOtherCaller is false when the response names no caller', () => {
  expect(isOtherCaller({ stamp: null, user })).toBe(false);
});

test('isOtherCaller ignores roles, session and memberships', () => {
  const stamp = stampFor('82e92667feb5824d; session=s; roles=r; memberships=m');
  expect(isOtherCaller({ stamp, user })).toBe(false);
});
