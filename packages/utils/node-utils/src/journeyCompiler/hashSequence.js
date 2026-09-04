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

import { createHash } from 'crypto';

// The candidate's name and its identity across runs. Eight hex characters of
// sha1 over the triples: short enough to read in a file name, and the whole
// point of a hash here is grouping, not collision resistance against an
// adversary.
function hashSequence({ sequence }) {
  const text = sequence
    .map(({ block_id: blockId, event_name: eventName, page_id: pageId }) =>
      [pageId, blockId, eventName].join(' ')
    )
    .join('\n');
  return createHash('sha1').update(text).digest('hex').slice(0, 8);
}

export default hashSequence;
