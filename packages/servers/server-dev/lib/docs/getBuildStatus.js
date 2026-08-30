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

import clientErrorStore from './clientErrorStore.js';
import serverErrorStore from './serverErrorStore.js';
import readBuildArtifact from './readBuildArtifact.js';

// Feedback loop for agents: build status (written by the build manager to
// build/buildStatus.json) plus recent browser errors reported via
// POST /api/client-error, plus recent server errors (request, endpoint, MCP and
// agent tool failures) collected by createHandleError. Lets an agent check "did my last edit work?"
// without tailing terminal logs.
function getBuildStatus() {
  const build = readBuildArtifact({ name: 'buildStatus.json' }) ?? {
    status: 'unknown',
    message:
      'No build status yet — the build manager has not written build/buildStatus.json. ' +
      'This is expected before the first build completes.',
  };
  return {
    build,
    clientErrors: clientErrorStore.list(),
    serverErrors: serverErrorStore.list(),
  };
}

export default getBuildStatus;
