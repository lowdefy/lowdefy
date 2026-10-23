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

import resolveRelativeDates from './resolveRelativeDates.js';
import { expect, test } from 'vitest';

test('resolveRelativeDates leaves fixed dates, other operators and groups intact', () => {
  const now = dayjs('2026-05-31T10:00:00');
  const condition = {
    or: [
      { key: 'd', op: 'before', value: '2026-01-01' },
      { key: 'd', op: 'within', value: { last: 7, unit: 'day' } },
      { and: [{ key: 'd', op: 'after', value: { next: 1, unit: 'month' } }] },
    ],
  };
  const resolved = resolveRelativeDates({ condition, now });
  expect(resolved.or[0]).toEqual(condition.or[0]);
  expect(resolved.or[1]).toEqual(condition.or[1]);
  expect(resolved.or[2].and[0].value).toBe(dayjs('2026-06-30T10:00:00').endOf('day').toISOString());
});
