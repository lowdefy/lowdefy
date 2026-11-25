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

import normalizeRefPath from './normalizeRefPath.js';

// The endpoints to rebuild for edited skeleton source files, or null when one
// of the files is read by more than endpoints with a source of their own, and
// the config must be built. Each file is named as refMap names it: relative to
// the config directory for the app's files, absolute for a module's.
function findEndpointsReadingFiles({ endpointRegistry, files }) {
  const endpointIds = new Set();
  for (const file of files.map(normalizeRefPath)) {
    if (endpointRegistry.otherFiles.has(file)) {
      return null;
    }
    let read = false;
    for (const entry of endpointRegistry.endpoints.values()) {
      if (entry.files.has(file)) {
        endpointIds.add(entry.endpointId);
        read = true;
      }
    }
    if (!read) {
      return null;
    }
  }
  return [...endpointIds];
}

export default findEndpointsReadingFiles;
