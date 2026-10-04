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

const UNIT_MS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000 };

// A wall-clock duration such as 20m, 90s or 1h (a bare number is minutes),
// in milliseconds. Throws for anything else.
function parseDuration({ value, flag }) {
  const match = /^(\d+(?:\.\d+)?)([smh]?)$/.exec(String(value ?? '').trim());
  if (type.isNone(value) || match === null || Number(match[1]) <= 0) {
    throw new Error(
      `${flag} should be a duration such as 20m, 90s or 1h. Received ${JSON.stringify(value)}.`
    );
  }
  return Math.round(Number(match[1]) * UNIT_MS[match[2] === '' ? 'm' : match[2]]);
}

export default parseDuration;
