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

import isUserBanned from './isUserBanned.js';

const past = new Date(Date.now() - 3600 * 1000).toISOString();
const future = new Date(Date.now() + 3600 * 1000).toISOString();

test('isUserBanned returns false for a user who is not banned', () => {
  expect(isUserBanned({ user: { banned: false } })).toBe(false);
  expect(isUserBanned({ user: {} })).toBe(false);
});

test('isUserBanned returns true for a ban with no expiry', () => {
  expect(isUserBanned({ user: { banned: true } })).toBe(true);
  expect(isUserBanned({ user: { banned: true, banExpires: null } })).toBe(true);
});

test('isUserBanned returns true for a ban that expires in the future', () => {
  expect(isUserBanned({ user: { banned: true, banExpires: future } })).toBe(true);
  expect(isUserBanned({ user: { banned: true, banExpires: new Date(future) } })).toBe(true);
});

test('isUserBanned returns false for a ban that has expired', () => {
  expect(isUserBanned({ user: { banned: true, banExpires: past } })).toBe(false);
});
