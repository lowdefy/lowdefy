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

// A step that needs longer than a minute is a hung page, and a failing journey
// should report in minutes, not hours.
const MAX_JOURNEY_TIMEOUT = 60000;

// The journey's `timeout`: how long each step may wait, in milliseconds.
// Returns an error message, or undefined when it is omitted or well-formed.
function validateJourneyTimeout({ timeout }) {
  if (type.isUndefined(timeout)) {
    return undefined;
  }
  if (!type.isInt(timeout) || timeout < 1 || timeout > MAX_JOURNEY_TIMEOUT) {
    return `The journey "timeout" must be a whole number of milliseconds from 1 to ${MAX_JOURNEY_TIMEOUT}. Received ${JSON.stringify(
      timeout
    )}.`;
  }
  return undefined;
}

export { MAX_JOURNEY_TIMEOUT };
export default validateJourneyTimeout;
