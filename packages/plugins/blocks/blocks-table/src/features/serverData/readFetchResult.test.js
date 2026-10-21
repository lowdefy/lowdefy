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

import readFetchResult from './readFetchResult.js';

const rows = [{ _id: 'r1' }];

test('readFetchResult reads the Request action response list', () => {
  const result = { responses: { __tableFetch: { response: [{ rows, total: 1 }] } } };
  expect(readFetchResult({ result, isGroupLevel: false })).toEqual({
    entries: rows,
    total: 1,
    aggregates: null,
  });
});

test('readFetchResult reads the CallAPI action routine response', () => {
  const result = {
    responses: {
      __tableFetch: {
        response: { response: { rows, total: 1 }, status: 'success', success: true },
      },
    },
  };
  expect(readFetchResult({ result, isGroupLevel: false })).toEqual({
    entries: rows,
    total: 1,
    aggregates: null,
  });
});

test('readFetchResult throws for a routine response without rows', () => {
  const result = { responses: { __tableFetch: { response: { response: { refused: true } } } } };
  expect(() => readFetchResult({ result, isGroupLevel: false })).toThrow(
    'must return { rows, total }'
  );
});
