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
import readBuildArtifact from './readBuildArtifact.js';

function modifiedAt(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}

// Sorts the registered pages by what the dev server knows about them. A page
// is edited when a file its last JIT build read has changed or gone since that
// build. A page not built since the server started is edited when its own page
// file changed after the start, and is otherwise unbuilt: nothing has checked
// it yet. failed lists the pages whose last build failed, with its errors.
function reviewPageBuilds() {
  const registry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const edited = [];
  const unbuilt = [];
  const failed = [];
  for (const [pageId, entry] of Object.entries(registry)) {
    const record = pageBuildRecords.get(pageId);
    if (record) {
      if (record.errors) {
        failed.push({ pageId, errors: record.errors });
      }
      const changed = [...record.files].some((filePath) => {
        const mtime = modifiedAt(filePath);
        return mtime === null || mtime > record.builtAt;
      });
      if (changed) {
        edited.push(pageId);
      }
      continue;
    }
    const pageFileModifiedAt = entry.refPath
      ? modifiedAt(path.resolve(configDirectory, entry.refPath))
      : null;
    if (pageFileModifiedAt !== null && pageFileModifiedAt > performance.timeOrigin) {
      edited.push(pageId);
    } else {
      unbuilt.push(pageId);
    }
  }
  return { edited, unbuilt, failed };
}

export default reviewPageBuilds;
