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

import authEngineActions from './authEngineActions.js';
import pageBlocks from './pageBlocks.js';
import readExploreArtifact from './readExploreArtifact.js';

// The blocks of a page whose events run an action that calls the auth engine.
// A walk offers no control on them: its injected caller has no auth engine
// session, so they fail every time.
function findAuthActionBlocks({ buildDirectory, pageId }) {
  const page = readExploreArtifact({ buildDirectory, name: `pages/${pageId}.json` });
  if (page === null) {
    throw new Error(`Page "${pageId}" has no build artifact in ${buildDirectory}.`);
  }
  return pageBlocks(page)
    .filter(({ actions }) => actions.some((action) => authEngineActions.has(action.type)))
    .map(({ blockId }) => blockId);
}

export default findAuthActionBlocks;
