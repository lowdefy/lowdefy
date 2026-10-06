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

import mergeCollectionIndexes from './mergeCollectionIndexes.js';

test('mergeCollectionIndexes lets a later index replace an earlier one with the same key', () => {
  expect(
    mergeCollectionIndexes({
      dataSetName: 'sample',
      collection: 'tickets',
      indexes: [
        { key: { a: 1 }, name: 'a_1' },
        { key: { b: 1 }, name: 'b_1' },
        { key: { a: 1 }, name: 'a_unique', unique: true },
      ],
    })
  ).toEqual([
    { key: { a: 1 }, name: 'a_unique', unique: true },
    { key: { b: 1 }, name: 'b_1' },
  ]);
});

test('mergeCollectionIndexes drops expireAfterSeconds and keeps every other option', () => {
  expect(
    mergeCollectionIndexes({
      dataSetName: 'sample',
      collection: 'events',
      indexes: [{ key: { created: 1 }, name: 'ttl', expireAfterSeconds: 60, sparse: true }],
    })
  ).toEqual([{ key: { created: 1 }, name: 'ttl', sparse: true }]);
});

test('mergeCollectionIndexes throws naming both keys when two indexes share a name', () => {
  expect(() =>
    mergeCollectionIndexes({
      dataSetName: 'sample',
      collection: 'tickets',
      indexes: [
        { key: { a: 1 }, name: 'idx' },
        { key: { b: 1 }, name: 'idx' },
      ],
    })
  ).toThrow(
    'Data set "sample" collection "tickets" has two indexes named "idx" with different keys: {"a":1} and {"b":1}.'
  );
});
