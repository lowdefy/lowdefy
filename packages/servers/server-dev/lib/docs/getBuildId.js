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

import readBuildArtifact from './readBuildArtifact.js';

// Identifies the build the dev server is serving: the time of the latest
// config build (build/buildStatus.json) or page invalidation (the timestamp the
// manager writes to build/invalidatePages), whichever is later. Browser and
// server errors are stamped with it, so build status can tell errors from
// before the latest edit apart from live ones. Null before the first build.
function getBuildId() {
  const build = readBuildArtifact({ name: 'buildStatus.json' });
  const builtAt = build?.timestamp ? Date.parse(build.timestamp) : 0;
  let invalidatedAt = 0;
  try {
    invalidatedAt = Number(
      fs.readFileSync(path.join(process.cwd(), 'build', 'invalidatePages'), 'utf8')
    );
  } catch {
    // No page edit since the last config build.
  }
  const latest = Math.max(builtAt, invalidatedAt || 0);
  return latest > 0 ? new Date(latest).toISOString() : null;
}

export default getBuildId;
