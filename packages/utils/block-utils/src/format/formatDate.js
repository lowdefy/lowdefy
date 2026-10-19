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
import relativeTime from 'dayjs/plugin/relativeTime.js';

// Parsing and formatting with dayjs costs about 6 us a value, and tables format
// the same dates for every row they export or search. Absolute formats of
// string and number values are kept per dayjs locale (relative ones depend on
// now); the cap bounds memory for columns of unique timestamps.
const MAX_CACHED = 10000;
const cache = new Map();

function formatAbsolute({ value, format }) {
  const date = dayjs(value);
  if (!date.isValid()) return null;
  return date.format(format);
}

// Formats a date with a dayjs format string, or relative to now ("3 hours
// ago"). Returns null when the value is not a date.
function formatDate({ value, format, relative }) {
  if (!relative && (typeof value === 'string' || typeof value === 'number')) {
    const key = `${dayjs.locale()}\u0000${format}\u0000${value}`;
    let text = cache.get(key);
    if (text === undefined) {
      text = formatAbsolute({ value, format });
      if (cache.size >= MAX_CACHED) cache.clear();
      cache.set(key, text);
    }
    return text;
  }
  const date = dayjs(value);
  if (!date.isValid()) return null;
  if (relative) {
    // Extended here rather than at import: block-utils has no import-time side
    // effects, and dayjs installs a plugin only once.
    dayjs.extend(relativeTime);
    return date.fromNow();
  }
  return date.format(format);
}

export default formatDate;
