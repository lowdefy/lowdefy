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

import parseCallerStamp from './parseCallerStamp.js';

test('parseCallerStamp reads every field of a full stamp', () => {
  expect(
    parseCallerStamp(
      '82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b; memberships=476954726056d64d'
    )
  ).toEqual({
    caller: '82e92667feb5824d',
    session: '3a1d7b6848ba4816',
    roles: '228d50a09b1b1e2b',
    memberships: '476954726056d64d',
  });
});

test('parseCallerStamp reads an anonymous stamp as an empty caller with no fields', () => {
  expect(parseCallerStamp('')).toEqual({
    caller: '',
    session: null,
    roles: null,
    memberships: null,
  });
});

test('parseCallerStamp is null when the response carries no header', () => {
  expect(parseCallerStamp(null)).toBe(null);
  expect(parseCallerStamp(undefined)).toBe(null);
});

test('parseCallerStamp reads a caller-only stamp', () => {
  expect(parseCallerStamp('82e92667feb5824d')).toEqual({
    caller: '82e92667feb5824d',
    session: null,
    roles: null,
    memberships: null,
  });
});

test('parseCallerStamp leaves fields the stamp does not carry as null', () => {
  expect(parseCallerStamp('82e92667feb5824d; roles=228d50a09b1b1e2b')).toEqual({
    caller: '82e92667feb5824d',
    session: null,
    roles: '228d50a09b1b1e2b',
    memberships: null,
  });
});

test('parseCallerStamp ignores unknown and malformed fields', () => {
  expect(parseCallerStamp('abc;roles=r1; other=x; =y; memberships; session=s1')).toEqual({
    caller: 'abc',
    session: 's1',
    roles: 'r1',
    memberships: null,
  });
});
