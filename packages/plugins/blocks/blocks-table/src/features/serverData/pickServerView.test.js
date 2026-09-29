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

import pickServerView from './pickServerView.js';

test('pickServerView keeps only the parts the server reads, with empty defaults', () => {
  expect(
    pickServerView({
      view: {
        columns: [{ key: 'a' }],
        density: 'compact',
        sort: [{ key: 'a' }],
        search: '',
      },
      columns: [{ key: 'a' }],
    })
  ).toEqual({ sort: [{ key: 'a' }], filter: null, search: null, group: [], aggregates: {} });
});

test('pickServerView sends the aggregates in effect: view entries over column defaults', () => {
  expect(
    pickServerView({
      view: { aggregates: { amount: 'avg', count: null } },
      columns: [
        { key: 'name' },
        { key: 'amount', aggregate: 'sum' },
        { key: 'count', aggregate: 'sum' },
        { key: 'score', aggregate: 'max' },
      ],
    }).aggregates
  ).toEqual({ amount: 'avg', score: 'max' });
});
