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

import isProcessStartTime from './isProcessStartTime.js';

// Anything that is not a start time - null from a read that failed, or a format an older
// Lowdefy recorded (local time, or epoch milliseconds read from the Linux wall clock) -
// cannot be compared, so it proves nothing either way: 'unknown', never 'different'.
function compareProcessStartTimes({ recorded, current }) {
  if (
    !isProcessStartTime(recorded) ||
    !isProcessStartTime(current) ||
    typeof recorded !== typeof current
  ) {
    return 'unknown';
  }
  return recorded === current ? 'same' : 'different';
}

export default compareProcessStartTimes;
