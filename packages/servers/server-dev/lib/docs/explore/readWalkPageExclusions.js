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

import findAuthActionBlocks from './findAuthActionBlocks.js';
import findExternalBlocks from './findExternalBlocks.js';

// The blocks of a page a walk leaves out: those reaching a connection no data
// set redirects, and those running an auth-engine action. Worked out once per
// page the walk shows, from the dev server's built artifacts, which exist by
// the time a page has settled.
function readWalkPageExclusions({ walk, pageId }) {
  if (!walk.exclusions.has(pageId)) {
    const { buildDirectory } = walk;
    walk.exclusions.set(pageId, {
      externalBlocks: findExternalBlocks({ buildDirectory, pageId }).blocks,
      authActionBlocks: findAuthActionBlocks({ buildDirectory, pageId }),
    });
  }
  return walk.exclusions.get(pageId);
}

export default readWalkPageExclusions;
