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

const emptyTime = { clock: '', relative: '', absolute: '', dateTime: undefined };

const units = [
  { unit: 'second', ms: 1000, limit: 60 },
  { unit: 'minute', ms: 60 * 1000, limit: 60 },
  { unit: 'hour', ms: 60 * 60 * 1000, limit: 24 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000, limit: 30 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000, limit: 12 },
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000, limit: Infinity },
];

// Intl resolves the browser locale, so clock, date and "5m ago" all read in the viewer's language.
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'narrow' });
const clockFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
const absoluteFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

function formatTime(value) {
  if (type.isNone(value) || value === '') return emptyTime;
  const date = new Date(value);
  const time = date.getTime();
  if (Number.isNaN(time)) return emptyTime;
  const elapsed = Date.now() - time;
  const { unit, ms } = units.find(({ ms: size, limit }) => Math.abs(elapsed) / size < limit);
  return {
    clock: clockFormat.format(date),
    relative: relativeFormat.format(-Math.round(elapsed / ms), unit),
    absolute: absoluteFormat.format(date),
    dateTime: date.toISOString(),
  };
}

export default formatTime;
