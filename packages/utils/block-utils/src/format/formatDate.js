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

// Formats a date with a dayjs format string, or relative to now ("3 hours
// ago"). Returns null when the value is not a date.
function formatDate({ value, format, relative }) {
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
