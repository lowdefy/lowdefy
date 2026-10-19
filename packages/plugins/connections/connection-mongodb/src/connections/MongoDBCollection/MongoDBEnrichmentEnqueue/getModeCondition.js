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

import enrichPath from '../enrichment/enrichPath.js';
import getLiveCondition from '../enrichment/getLiveCondition.js';

// The cells of a column a run mode enqueues. None of them is live (queued, or running with a
// lease that has not run out), so a run in progress is never restarted:
//   all:    every cell that is not live;
//   empty:  cells never run (no `_enrich.<key>`) or that found no result;
//   errors: cells that failed;
//   stale:  cells with a result, whose inputHash is then compared with the current inputs.
function getModeCondition({ mode, columnKey, now }) {
  const statusPath = enrichPath({ columnKey, property: 'status' });
  const notLive = { $nor: [getLiveCondition({ columnKey, now })] };
  switch (mode) {
    case 'empty':
      return { [statusPath]: { $in: [null, 'empty'] } };
    case 'errors':
      return { [statusPath]: 'error' };
    case 'stale':
      return {
        $and: [notLive, { [enrichPath({ columnKey, property: 'inputHash' })]: { $exists: true } }],
      };
    default:
      return notLive;
  }
}

export default getModeCondition;
