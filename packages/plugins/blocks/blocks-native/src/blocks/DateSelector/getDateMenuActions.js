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

import { type } from '@lowdefy/helpers';

const DAY = 24 * 60 * 60 * 1000;

const SHORTCUTS = [
  { id: 'today', title: 'Today', image: 'sun.max', days: 0 },
  { id: 'tomorrow', title: 'Tomorrow', image: 'sunrise', days: 1 },
  { id: 'next_week', title: 'Next week', image: 'calendar.badge.clock', days: 7 },
];

function isSameDay(a, b) {
  return type.isDate(a) && type.isDate(b) && a.getTime() === b.getTime();
}

function isOutside({ day, max, min }) {
  return (type.isDate(min) && day < min) || (type.isDate(max) && day > max);
}

/**
 * The native menu of a DateSelector with `variant: row`, as iOS Reminders offers a date: Today,
 * Tomorrow and Next week (a week from today), the one the value is on checked and any outside
 * the min and max days dimmed, then "Pick a date…", which opens the calendar, and Clear while
 * there is a value that can be cleared. A shortcut's id names its day in `getDays`.
 *
 * @param {Object} params
 * @param {boolean} params.allowClear
 * @param {Date} [params.max] The latest day that can be picked, at midnight UTC.
 * @param {Date} [params.min] The earliest day that can be picked, at midnight UTC.
 * @param {Date} params.today Today at midnight UTC (toUtcDay).
 * @param {Date|null} params.value
 * @returns {{ actions: Object[], days: Object }} The MenuView actions, and each shortcut's day
 *   by action id.
 */
function getDateMenuActions({ allowClear, max, min, today, value }) {
  const days = {};
  const actions = SHORTCUTS.map(({ days: offset, id, image, title }) => {
    const day = new Date(today.getTime() + offset * DAY);
    days[id] = day;
    return {
      id,
      title,
      image,
      state: isSameDay(day, value) ? 'on' : 'off',
      attributes: { disabled: isOutside({ day, max, min }) },
    };
  });
  actions.push({ id: 'pick', title: 'Pick a date…', image: 'calendar' });
  if (allowClear && type.isDate(value)) {
    actions.push({
      id: 'clear',
      title: 'Clear',
      image: 'xmark.circle',
      attributes: { destructive: true },
    });
  }
  return { actions, days };
}

export default getDateMenuActions;
