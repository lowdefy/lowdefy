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

import fs from 'node:fs';
import path from 'node:path';

import pageBuildRecords from '../server/pageBuildRecords.js';
import { reviewBuiltPage } from '../server/jitPageBuilder.js';

async function readModifiedAt(filePath) {
  try {
    return (await fs.promises.stat(filePath)).mtimeMs;
  } catch {
    return null;
  }
}

// A page built since the server started is edited when its next request would
// rebuild it (see reviewBuiltPage): it was built on an earlier build context
// (a config build was published since), or a change event since its build
// touched it, which for a page whose build ran app code is any change event.
// A page not built since the server started is edited when its own page file
// changed after the start. signals is what syncBuildSignals returned.
// Returns 'edited', 'unbuilt' (never built and not edited) or 'current'.
async function reviewPage({ pageId, entry, configDirectory, signals }) {
  if (pageBuildRecords.get(pageId)) {
    return reviewBuiltPage({ pageId, ...signals });
  }
  const pageFileModifiedAt = entry?.refPath
    ? await readModifiedAt(path.resolve(configDirectory, entry.refPath))
    : null;
  if (pageFileModifiedAt !== null && pageFileModifiedAt > performance.timeOrigin) {
    return 'edited';
  }
  return 'unbuilt';
}

export default reviewPage;
