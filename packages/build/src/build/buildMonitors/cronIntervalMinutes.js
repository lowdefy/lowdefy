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

// The longest gap, in minutes, between two consecutive firings of a cron
// expression from the subset the build already validates (5 numeric fields,
// day-of-month and day-of-week mutually exclusive). A "the schedule did not
// run" monitor needs the longest normal gap, not the shortest: alerting on
// anything narrower fires on every healthy weekly job.
//
// Returns null when the expression never fires twice inside the sampled year
// (e.g. "0 0 30 2 *"), so the caller can skip the monitor rather than invent
// a window.

const SAMPLE_DAYS = 400;
const MINUTES_PER_DAY = 1440;

function expandField(field, min, max) {
  const values = new Set();
  for (const part of field.split(',')) {
    let range = part;
    let step = 1;
    if (part.includes('/')) {
      const [rangePart, stepPart] = part.split('/');
      range = rangePart;
      step = Number(stepPart);
    }
    let start = min;
    let end = max;
    if (range !== '*') {
      if (range.includes('-')) {
        const [startStr, endStr] = range.split('-');
        start = Number(startStr);
        end = Number(endStr);
      } else {
        start = Number(range);
        end = part.includes('/') ? max : start;
      }
    }
    for (let value = start; value <= end; value += step) {
      values.add(value);
    }
  }
  return [...values].sort((a, b) => a - b);
}

function firingDayOffsets({ daysOfMonth, months, daysOfWeek }) {
  const offsets = [];
  // A fixed epoch keeps the artifact deterministic: the answer describes the
  // schedule's shape, not the day the build ran. 2024 is a leap year, so a
  // 400-day walk from January covers every month length once.
  const epoch = Date.UTC(2024, 0, 1);
  for (let day = 0; day < SAMPLE_DAYS; day += 1) {
    const date = new Date(epoch + day * 86400000);
    if (!months.includes(date.getUTCMonth() + 1)) continue;
    if (!daysOfMonth.includes(date.getUTCDate())) continue;
    if (!daysOfWeek.includes(date.getUTCDay())) continue;
    offsets.push(day);
  }
  return offsets;
}

function cronIntervalMinutes(expression) {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const [minuteField, hourField, domField, monthField, dowField] = fields;
  const minutes = expandField(minuteField, 0, 59);
  const hours = expandField(hourField, 0, 23);
  const daysOfMonth = expandField(domField, 1, 31);
  const months = expandField(monthField, 1, 12);
  const daysOfWeek = expandField(dowField, 0, 6);
  if (minutes.length === 0 || hours.length === 0) return null;

  const minutesOfDay = [];
  for (const hour of hours) {
    for (const minute of minutes) {
      minutesOfDay.push(hour * 60 + minute);
    }
  }
  minutesOfDay.sort((a, b) => a - b);

  let intraDayGap = 0;
  for (let i = 1; i < minutesOfDay.length; i += 1) {
    intraDayGap = Math.max(intraDayGap, minutesOfDay[i] - minutesOfDay[i - 1]);
  }

  const dayOffsets = firingDayOffsets({ daysOfMonth, months, daysOfWeek });
  if (dayOffsets.length < 2) return null;
  let maxDayGap = 0;
  for (let i = 1; i < dayOffsets.length; i += 1) {
    maxDayGap = Math.max(maxDayGap, dayOffsets[i] - dayOffsets[i - 1]);
  }

  const first = minutesOfDay[0];
  const last = minutesOfDay[minutesOfDay.length - 1];
  const crossDayGap = maxDayGap * MINUTES_PER_DAY - last + first;
  return Math.max(intraDayGap, crossDayGap);
}

export default cronIntervalMinutes;
