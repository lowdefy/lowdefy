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
import getBuildId from './getBuildId.js';
import getPageBuildStatus from './getPageBuildStatus.js';
import serverErrorStore from './serverErrorStore.js';
import readBuildArtifact from './readBuildArtifact.js';

const EARLIER_ERRORS_NOTE =
  'Reported under an earlier build, before the latest config build or page edit, so they may already be fixed. Reload or re-run the page to see whether they still happen.';

function splitByBuild({ entries, buildId }) {
  return {
    current: entries.filter((entry) => entry.buildId === buildId),
    earlier: entries.filter((entry) => entry.buildId !== buildId),
  };
}

// Feedback loop for agents: build status (written by the build manager to
// build/buildStatus.json), the page builds (see getPageBuildStatus), plus
// recent browser errors reported via POST /api/client-error, plus recent server
// errors (request, endpoint, MCP and agent tool failures) collected by
// createHandleError. Lets an agent check "did my last edit work?" without
// tailing terminal logs. Errors reported under an earlier build are listed
// apart under earlierErrors.
function getBuildStatus({ checked } = {}) {
  const build = readBuildArtifact({ name: 'buildStatus.json' }) ?? {
    status: 'unknown',
    message:
      'No build status yet — the build manager has not written build/buildStatus.json. ' +
      'This is expected before the first build completes.',
  };
  const buildId = getBuildId();
  const clientErrors = splitByBuild({ entries: clientErrorStore.list(), buildId });
  const serverErrors = splitByBuild({ entries: serverErrorStore.list(), buildId });
  const status = {
    build,
    pages: getPageBuildStatus({ checked }),
    clientErrors: clientErrors.current,
    serverErrors: serverErrors.current,
  };
  if (clientErrors.earlier.length > 0 || serverErrors.earlier.length > 0) {
    status.earlierErrors = {
      note: EARLIER_ERRORS_NOTE,
      clientErrors: clientErrors.earlier,
      serverErrors: serverErrors.earlier,
    };
  }
  return status;
}

export default getBuildStatus;
