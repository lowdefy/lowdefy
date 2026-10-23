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

function daysInMonth({ year, month }) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// A calendar day moved by count units. A month or year keeps the day of the month, clamped to
// the last day of a shorter month (31 March less a month is 28 February), as the Table does.
function shiftDay({ date, count, unit }) {
  const { year, month, day } = date;
  if (unit === 'day') return { year, month, day: day + count };
  if (unit === 'week') return { year, month, day: day + 7 * count };
  const monthIndex = (unit === 'month' ? month - 1 + count : month - 1) + year * 12;
  const shiftedYear = Math.floor(monthIndex / 12) + (unit === 'year' ? count : 0);
  const shiftedMonth = (monthIndex % 12) + 1;
  return {
    year: shiftedYear,
    month: shiftedMonth,
    day: Math.min(day, daysInMonth({ year: shiftedYear, month: shiftedMonth })),
  };
}

export default shiftDay;
