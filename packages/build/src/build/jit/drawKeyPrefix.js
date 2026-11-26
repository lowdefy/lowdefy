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

import { randomBytes } from 'crypto';

// 2 random bytes, so 65,536 prefixes.
const prefixCount = 65536;

const drawnPrefixes = new Set();

// The key prefix of a dev config build. The dev server tells config builds
// apart by it: a page build that a publish overtook (skipStaleMapWrites and
// the page builder's in-flight check), and a key of an earlier build, which
// must name no node of the new one. Drawn at random, two builds of one dev
// session shared a prefix about once in 65,536 publishes, so a prefix this
// process drew before is drawn again, until every prefix has been used once.
function drawKeyPrefix() {
  if (drawnPrefixes.size === prefixCount) {
    drawnPrefixes.clear();
  }
  let prefix;
  do {
    prefix = `${randomBytes(2).toString('hex')}_`;
  } while (drawnPrefixes.has(prefix));
  drawnPrefixes.add(prefix);
  return prefix;
}

export default drawKeyPrefix;
