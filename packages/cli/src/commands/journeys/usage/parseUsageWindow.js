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

const DEFAULT_USAGE_WINDOW = '3m';
const MONTHS_PATTERN = /^([1-9]\d*)m$/;

// `--usage-window <n>m`: how many calendar months a journey's recent use is
// read over. Returns the number of months; 3 when the flag is not given.
function parseUsageWindow(value) {
  const window = type.isNone(value) ? DEFAULT_USAGE_WINDOW : value;
  const match = type.isString(window) ? MONTHS_PATTERN.exec(window) : null;
  if (match === null) {
    throw new Error(
      `--usage-window takes a number of calendar months such as 3m. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  return Number(match[1]);
}

export default parseUsageWindow;
