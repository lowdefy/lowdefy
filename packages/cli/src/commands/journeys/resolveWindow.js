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

import parseSince from './parseSince.js';

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PRODUCTION_DEFAULT_SINCE = '30d';

function parseDay({ flag, day, endOfDay }) {
  if (!DAY_PATTERN.test(day) || Number.isNaN(Date.parse(day))) {
    throw new Error(`${flag} takes a date as YYYY-MM-DD. Received "${day}".`);
  }
  return Date.parse(`${day}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
}

// The time window of a compile, as { since, until } in epoch milliseconds.
// `--from`/`--to` give production an explicit window of whole UTC days;
// otherwise `--since` sets the start, and production defaults to 30 days so a
// compile never silently reads a year of traces.
function resolveWindow({ options, source, now }) {
  const explicit = !type.isNone(options.from) || !type.isNone(options.to);
  if (explicit) {
    if (source !== 'production') {
      throw new Error(
        `--from and --to give a production window; for ${source} traces use --since.`
      );
    }
    if (!type.isNone(options.since)) {
      throw new Error(
        '--from and --to are an explicit window instead of --since; pass one or the other.'
      );
    }
    return {
      since: type.isNone(options.from)
        ? undefined
        : parseDay({ flag: '--from', day: options.from, endOfDay: false }),
      until: type.isNone(options.to)
        ? undefined
        : parseDay({ flag: '--to', day: options.to, endOfDay: true }),
    };
  }
  const since = options.since ?? (source === 'production' ? PRODUCTION_DEFAULT_SINCE : undefined);
  return { since: type.isNone(since) ? undefined : parseSince({ since, now }), until: undefined };
}

export { PRODUCTION_DEFAULT_SINCE };

export default resolveWindow;
