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

import isActiveMember from './isActiveMember.js';

test('isActiveMember is false when there is no member row', () => {
  expect(isActiveMember({ member: null })).toBe(false);
  expect(isActiveMember({ member: undefined })).toBe(false);
});

test('isActiveMember is true for a row with no suspended field, written before it existed', () => {
  expect(isActiveMember({ member: { id: 'member_1' } })).toBe(true);
});

test('isActiveMember is true for a row whose suspension was lifted', () => {
  expect(isActiveMember({ member: { id: 'member_1', suspended: false } })).toBe(true);
});

test('isActiveMember is false for a suspended row', () => {
  expect(isActiveMember({ member: { id: 'member_1', suspended: true } })).toBe(false);
});
