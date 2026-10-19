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

import getAggregateText from './getAggregateText.js';

test('getAggregateText formats counts, percentages and column values', () => {
  const amount = { type: 'currency', cell: { currency: 'USD', locale: 'en-US' } };
  expect(getAggregateText({ fn: 'count', value: 1200, column: amount })).toBe('1,200');
  expect(getAggregateText({ fn: 'percentEmpty', value: 0.256, column: amount })).toBe('25.6%');
  expect(getAggregateText({ fn: 'sum', value: 10.5, column: amount })).toBe('$10.50');
  expect(
    getAggregateText({
      fn: 'avg',
      value: 33.3333,
      column: { type: 'progress', cell: { locale: 'en-US' } },
    })
  ).toBe('33.3%');
  expect(
    getAggregateText({
      fn: 'latest',
      value: '2026-03-01T10:00:00',
      column: { type: 'date', cell: {} },
    })
  ).toBe('2026-03-01');
  expect(getAggregateText({ fn: 'avg', value: null, column: amount })).toBe('');
});
