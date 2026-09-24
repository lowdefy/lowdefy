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

import readBuildArtifact from './readBuildArtifact.js';

// When a dev rebuild fails the manager writes status "error" to
// build/buildStatus.json but leaves the previous build's artifacts in place, so
// every docs read keeps answering from a build that predates the caller's
// edits. Returns null — not { stale: false } — when the build is ok or unknown:
// a response with no stale fields means not stale, and a false flag on every
// response costs tokens on every call.
function getStaleStatus() {
  const build = readBuildArtifact({ name: 'buildStatus.json' });
  if (build?.status !== 'error') return null;
  return {
    stale: true,
    staleSince: build.timestamp ?? null,
    staleReason:
      'The last build failed. The dev server is still serving the previous successful build, so this result may not reflect your latest edits. Call lowdefy_build_status (or GET /lowdefy-docs/build-status) for the errors.',
  };
}

export default getStaleStatus;
