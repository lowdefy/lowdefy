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

import receiveSyncedValue from './receiveSyncedValue.js';

const first = { or: [{ key: 'amount', op: 'lt', value: 200 }] };
const second = { or: [{ key: 'amount', op: 'lt', value: 200 }, { and: [] }] };
const third = { or: [{ key: 'amount', op: 'lt', value: 200 }, { and: [{ key: 'amount' }] }] };

test('receiveSyncedValue treats any value as external when nothing is in flight', () => {
  expect(receiveSyncedValue({ inFlight: [], value: first })).toEqual({
    external: true,
    inFlight: [],
  });
});

test('receiveSyncedValue treats the latest write committing as caught up', () => {
  expect(receiveSyncedValue({ inFlight: [first, second], value: second })).toEqual({
    external: false,
    inFlight: [],
  });
});

test('receiveSyncedValue keeps writes in flight when an older write commits after a newer was sent', () => {
  expect(receiveSyncedValue({ inFlight: [first, second, third], value: second })).toEqual({
    external: false,
    inFlight: [first, second, third],
  });
});

test('receiveSyncedValue treats a value matching no write as external and drops the writes', () => {
  const external = { and: [{ key: 'stage', op: 'in', value: ['won'] }] };
  expect(receiveSyncedValue({ inFlight: [first, second], value: external })).toEqual({
    external: true,
    inFlight: [],
  });
});

test('receiveSyncedValue compares by content, with undefined the same as null', () => {
  expect(receiveSyncedValue({ inFlight: [{ ...first }, null], value: undefined })).toEqual({
    external: false,
    inFlight: [],
  });
  expect(receiveSyncedValue({ inFlight: [{ ...first }, null], value: { ...first } })).toEqual({
    external: false,
    inFlight: [{ ...first }, null],
  });
});
