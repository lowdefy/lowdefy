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

import enrichPath from './enrichPath.js';

// A cell a worker may claim: queued and due (a retry waits until its backoff has passed), or
// running with a lease that ran out (its worker crashed or timed out).
function getClaimableCondition({ columnKey, now }) {
  return {
    $or: [
      {
        [enrichPath({ columnKey, property: 'status' })]: 'queued',
        [enrichPath({ columnKey, property: 'queuedAt' })]: { $lte: now },
      },
      {
        [enrichPath({ columnKey, property: 'status' })]: 'running',
        [enrichPath({ columnKey, property: 'leaseUntil' })]: { $lt: now },
      },
    ],
  };
}

export default getClaimableCondition;
