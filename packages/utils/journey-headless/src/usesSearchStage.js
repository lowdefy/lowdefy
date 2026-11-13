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

const SEARCH_STAGES = ['"$search"', '"$vectorSearch"'];

// Whether a server fault came from a request or endpoint whose built artifact uses an Atlas Search
// stage ($search, $vectorSearch), which a data set's memory store cannot run: the environment's
// limit, not the app's fault, as the browser runner judges it.
function usesSearchStage({ entry, host }) {
  let artifact = null;
  if (!type.isNone(entry.requestId) && !type.isNone(entry.pageId)) {
    artifact = host.readArtifact(`pages/${entry.pageId}/requests/${entry.requestId}.json`);
  } else if (!type.isNone(entry.endpointId)) {
    artifact = host.readArtifact(`api/${entry.endpointId}.json`);
  }
  const text = artifact === null ? '' : JSON.stringify(artifact);
  return SEARCH_STAGES.some((stage) => text.includes(stage));
}

export default usesSearchStage;
