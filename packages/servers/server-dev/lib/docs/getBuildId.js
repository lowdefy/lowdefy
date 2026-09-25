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

// The time of the latest successful config build. The manager rewrites
// build/buildStatus.json after every attempt, and a failed attempt keeps
// serving the previous build, so only an "ok" status moves this. The Hono
// process remembers the last one it read, since a failure overwrites it.
let publishedAt = 0;

function readPublishedAt() {
  try {
    const build = readBuildArtifact({ name: 'buildStatus.json' });
    if (build?.status === 'ok' && build.timestamp) {
      publishedAt = Math.max(publishedAt, Date.parse(build.timestamp));
    }
  } catch {
    // A half-written status file; the completed write is read next time.
  }
  return publishedAt;
}

function readInvalidatedAt() {
  try {
    return (
      Number(fs.readFileSync(path.join(process.cwd(), 'build', 'invalidatePages'), 'utf8')) || 0
    );
  } catch {
    // No page edit since the last config build.
    return 0;
  }
}

// Identifies the build the dev server is serving: the time of the latest
// successful config build or page invalidation (the timestamp the manager
// writes to build/invalidatePages), whichever is later. Browser and server
// errors are stamped with it, so build status can tell errors from before the
// latest edit apart from live ones. Null before a successful build is seen.
function getBuildId() {
  const latest = Math.max(readPublishedAt(), readInvalidatedAt());
  return latest > 0 ? new Date(latest).toISOString() : null;
}

export default getBuildId;
