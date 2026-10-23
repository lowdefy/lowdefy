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

import isReadOnlyRequest from './isReadOnlyRequest.js';

const requestMetas = {
  MongoDBFind: { checkRead: true, checkWrite: false },
  MongoDBAggregation: { checkRead: true, checkWrite: false },
  MongoDBUpdateOne: { checkRead: false, checkWrite: true },
};

test('isReadOnlyRequest is true for a type whose plugin says it never writes', () => {
  expect(
    isReadOnlyRequest({ request: { type: 'MongoDBFind', properties: {} }, requestMetas })
  ).toBe(true);
});

test('isReadOnlyRequest is false for a type that writes', () => {
  expect(
    isReadOnlyRequest({ request: { type: 'MongoDBUpdateOne', properties: {} }, requestMetas })
  ).toBe(false);
});

test('isReadOnlyRequest is false for a type without metadata', () => {
  expect(isReadOnlyRequest({ request: { type: 'AxiosHttp', properties: {} }, requestMetas })).toBe(
    false
  );
  expect(isReadOnlyRequest({ request: { type: 'MongoDBFind' }, requestMetas: undefined })).toBe(
    false
  );
});

test('isReadOnlyRequest is true for a literal pipeline without $out or $merge', () => {
  expect(
    isReadOnlyRequest({
      request: {
        type: 'MongoDBAggregation',
        properties: { pipeline: [{ $match: { a: 1 } }, { $project: { a: 1 } }] },
      },
      requestMetas,
    })
  ).toBe(true);
});

test('isReadOnlyRequest is false for a pipeline with a $out or $merge stage', () => {
  expect(
    isReadOnlyRequest({
      request: { type: 'MongoDBAggregation', properties: { pipeline: [{ $out: 'copy' }] } },
      requestMetas,
    })
  ).toBe(false);
  expect(
    isReadOnlyRequest({
      request: {
        type: 'MongoDBAggregation',
        properties: { pipeline: [{ $merge: { into: { _payload: 'target' } } }] },
      },
      requestMetas,
    })
  ).toBe(false);
});

test('isReadOnlyRequest is false for a pipeline an operator builds', () => {
  expect(
    isReadOnlyRequest({
      request: {
        type: 'MongoDBAggregation',
        properties: { pipeline: { _if: { test: true, then: [], else: [] } } },
      },
      requestMetas,
    })
  ).toBe(false);
});
