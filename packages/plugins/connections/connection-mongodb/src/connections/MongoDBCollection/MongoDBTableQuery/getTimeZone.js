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

// The IANA time zone day-based date filters compare in, UTC unless the request sets one.
function getTimeZone({ timezone, requestType }) {
  if (type.isNone(timezone)) return 'UTC';
  let valid = type.isString(timezone);
  if (valid) {
    // Intl is the only check of a zone name: it throws a RangeError for one it does not know.
    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch {
      valid = false;
    }
  }
  if (!valid) {
    throw new Error(
      `${requestType} "timezone" should be an IANA time zone name such as "Europe/London". Received ${JSON.stringify(
        timezone
      )}.`
    );
  }
  return timezone;
}

export default getTimeZone;
