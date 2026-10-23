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

import dayjs from 'dayjs';

import createRowTest from './createRowTest.js';
import { expect, test } from 'vitest';

const columnsByKey = {
  d: { key: 'd', field: 'd', type: 'date' },
  t: { key: 't', field: 't', type: 'datetime' },
};

function keep({ condition, rows, field = 'd' }) {
  const rowTest = createRowTest({
    condition,
    search: null,
    context: { columnsByKey },
    searchColumns: [],
  });
  return rows.filter((row) => rowTest(row)).map((row) => row[field]);
}

const day = (shift, unit) => dayjs().add(shift, unit).format('YYYY-MM-DD');

test('createRowTest before 3 months ago keeps only rows dated before that day', () => {
  const rows = [day(-4, 'month'), day(-3, 'month'), day(-2, 'month'), day(1, 'day')].map((d) => ({
    d,
  }));
  expect(
    keep({ condition: { key: 'd', op: 'before', value: { last: 3, unit: 'month' } }, rows })
  ).toEqual([day(-4, 'month')]);
});

test('createRowTest every unit in both directions', () => {
  for (const unit of ['day', 'week', 'month', 'year']) {
    const rows = [-2, -1, 0, 1, 2].map((n) => ({ d: day(n, unit) }));
    expect(keep({ condition: { key: 'd', op: 'before', value: { last: 1, unit } }, rows })).toEqual(
      [day(-2, unit)]
    );
    expect(keep({ condition: { key: 'd', op: 'after', value: { last: 1, unit } }, rows })).toEqual([
      day(0, unit),
      day(1, unit),
      day(2, unit),
    ]);
    expect(keep({ condition: { key: 'd', op: 'after', value: { next: 1, unit } }, rows })).toEqual([
      day(2, unit),
    ]);
    expect(keep({ condition: { key: 'd', op: 'before', value: { next: 1, unit } }, rows })).toEqual(
      [day(-2, unit), day(-1, unit), day(0, unit)]
    );
  }
});

test('createRowTest a datetime column compares whole days too', () => {
  const start = dayjs().subtract(3, 'month').startOf('day');
  const rows = [start.subtract(1, 'minute'), start, start.endOf('day'), start.add(1, 'day')].map(
    (date) => ({ t: date.toISOString() })
  );
  expect(
    keep({
      condition: { key: 't', op: 'before', value: { last: 3, unit: 'month' } },
      rows,
      field: 't',
    })
  ).toEqual([rows[0].t]);
  expect(
    keep({
      condition: { key: 't', op: 'after', value: { last: 3, unit: 'month' } },
      rows,
      field: 't',
    })
  ).toEqual([rows[3].t]);
});
