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

// What the lowdefy_run_journey tool returns of a run's `exercised` block.
// The full block lists every request, endpoint, event and rendered block, which
// is hundreds of lines for a short journey, so the tool returns a count of each
// by default. `selection` true returns the block whole, false leaves it out.
// Only the tool's response is trimmed: the REST route, and so `lowdefy test`'s
// exercised.json that the journey lints read, always carries the whole block.
function selectExercised({ exercised, selection }) {
  if (selection === true || type.isNone(exercised)) {
    return { exercised };
  }
  if (selection === false) {
    return {};
  }
  const counts = {};
  Object.entries(exercised).forEach(([key, value]) => {
    if (type.isArray(value)) counts[key] = value.length;
  });
  return { exercised: { counts, note: 'Pass exercised: true for the full block.' } };
}

export default selectExercised;
