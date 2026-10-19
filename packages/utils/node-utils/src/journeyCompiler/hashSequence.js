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

// A candidate's name and its identity across runs: eight hex characters of
// sha1 over the entry page and the sequence's entries, each the page it
// happened on and the step's identity. Short enough to read in a file name;
// the hash is for grouping, not collision resistance against an adversary.
function hashSequence({ pageId, sequence }) {
  const text = [pageId, ...sequence.map(({ page, identity }) => `${page} ${identity}`)].join('\n');
  return createHash('sha1').update(text).digest('hex').slice(0, 8);
}

export default hashSequence;
