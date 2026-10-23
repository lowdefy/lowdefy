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

import describeTableFilter from './describeTableFilter.js';
import { expect, test } from 'vitest';

const columns = [
  { key: 'name', title: 'Name', type: 'text' },
  {
    key: 'stage',
    title: 'Stage',
    type: 'status',
    options: [
      { value: 'lead', label: 'Lead' },
      { value: 'won', label: 'Won' },
      { value: 'lost', label: 'Lost' },
    ],
  },
  { key: 'amount', title: 'Amount', type: 'currency' },
  { key: 'owner', title: 'Owner', type: 'people' },
];

// compileTableQuery.test.js expects the same sentence from MongoDBTableQuery for these fields.
test('describeTableFilter reads the filter with column titles and option labels', () => {
  const condition = {
    and: [
      { key: 'stage', op: 'in', value: ['lead', 'won'] },
      { key: 'name', op: 'contains', value: 'CX' },
      {
        or: [
          { key: 'amount', op: 'gt', value: 1000 },
          { key: 'owner', op: 'contains', value: { $user: 'id' } },
        ],
      },
    ],
  };
  expect(describeTableFilter({ condition, columns })).toBe(
    'Stage is any of Lead or Won and Name contains CX and (Amount greater than 1000 or Owner has me)'
  );
});

test('describeTableFilter leaves out conditions still being built', () => {
  const condition = {
    and: [
      { key: 'name', op: 'contains', value: 'CX' },
      { key: 'amount', op: 'gt' },
    ],
  };
  expect(describeTableFilter({ condition, columns })).toBe('Name contains CX');
});

test('describeTableFilter returns null without a filter', () => {
  expect(describeTableFilter({ condition: null, columns })).toBe(null);
});
