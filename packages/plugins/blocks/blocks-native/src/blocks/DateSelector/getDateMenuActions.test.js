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

import getDateMenuActions from './getDateMenuActions.js';

const today = new Date(Date.UTC(2026, 9, 19));

test('getDateMenuActions offers today, tomorrow and next week, then Pick a date', () => {
  const { actions, days } = getDateMenuActions({ allowClear: true, today, value: null });
  expect(actions.map((action) => action.title)).toEqual([
    'Today',
    'Tomorrow',
    'Next week',
    'Pick a date…',
  ]);
  expect(days).toEqual({
    today: new Date(Date.UTC(2026, 9, 19)),
    tomorrow: new Date(Date.UTC(2026, 9, 20)),
    next_week: new Date(Date.UTC(2026, 9, 26)),
  });
  expect(actions.slice(0, 3).map((action) => action.state)).toEqual(['off', 'off', 'off']);
});

test('getDateMenuActions checks the day the value is on and offers Clear while it can clear', () => {
  const value = new Date(Date.UTC(2026, 9, 20));
  const { actions } = getDateMenuActions({ allowClear: true, today, value });
  expect(actions[1].state).toBe('on');
  expect(actions.at(-1)).toMatchObject({ id: 'clear', attributes: { destructive: true } });
  const kept = getDateMenuActions({ allowClear: false, today, value });
  expect(kept.actions.map((action) => action.id)).not.toContain('clear');
});

test('getDateMenuActions dims the shortcuts outside the min and max days', () => {
  const { actions } = getDateMenuActions({
    allowClear: true,
    max: new Date(Date.UTC(2026, 9, 22)),
    min: new Date(Date.UTC(2026, 9, 20)),
    today,
    value: null,
  });
  expect(actions.slice(0, 3).map((action) => action.attributes.disabled)).toEqual([
    true,
    false,
    true,
  ]);
});
