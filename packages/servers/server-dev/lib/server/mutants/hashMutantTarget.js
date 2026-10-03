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

import crypto from 'node:crypto';

// The content of a mutant's target, to tell copies of one written node apart
// from different nodes. The build gives blocks and requests ids that embed the
// page id and position (`block:tickets:footer:0`), so those are left out: two
// pages using one `_ref`'d layout carry the same node under different ids.
// JSON.stringify already leaves out the non-enumerable ~k.
function hashMutantTarget(node) {
  const content = JSON.stringify(node, (key, value) => {
    if (key === 'id' && typeof value === 'string' && /^(block|request):/.test(value)) {
      return undefined;
    }
    return value;
  });
  return crypto.createHash('sha1').update(content).digest('hex');
}

export default hashMutantTarget;
