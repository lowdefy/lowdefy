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

// A file's modified time, or null when it is gone. Each call returns a reader
// that stats a file once, so pages that share files cost one stat per file.
function createModifiedAt() {
  const modifiedTimes = new Map();
  return function modifiedAt(filePath) {
    if (!modifiedTimes.has(filePath)) {
      let mtime = null;
      try {
        mtime = fs.statSync(filePath).mtimeMs;
      } catch {
        mtime = null;
      }
      modifiedTimes.set(filePath, mtime);
    }
    return modifiedTimes.get(filePath);
  };
}

// A built page is edited when a file its last JIT build read has changed or
// gone since that build, or when a config build has replaced the page registry
// it was built against: the page builds against that build's connections,
// endpoints and plugin types, so an error it failed with may be fixed, or a new
// one caused, without any of its own files changing. A page not built since the
// server started is edited when its own page file changed after the start.
// Returns 'edited', 'unbuilt' (never built and not edited) or 'current'.
function reviewPage({ pageId, entry, modifiedAt, configDirectory }) {
  const record = pageBuildRecords.get(pageId);
  if (record) {
    const registryMtime = modifiedAt(path.join(process.cwd(), 'build', 'pageRegistry.json'));
    if (record.registryMtime !== registryMtime) {
      return 'edited';
    }
    const changed = [...record.files.keys()].some((filePath) => {
      const mtime = modifiedAt(filePath);
      return mtime === null || mtime > record.builtAt;
    });
    return changed ? 'edited' : 'current';
  }
  const pageFileModifiedAt = entry?.refPath
    ? modifiedAt(path.resolve(configDirectory, entry.refPath))
    : null;
  if (pageFileModifiedAt !== null && pageFileModifiedAt > performance.timeOrigin) {
    return 'edited';
  }
  return 'unbuilt';
}

export { createModifiedAt };
export default reviewPage;
