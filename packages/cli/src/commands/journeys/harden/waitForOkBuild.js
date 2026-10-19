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

import axios from 'axios';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readBuildStatus({ url }) {
  try {
    const response = await axios.get(`${url}/lowdefy-docs/build-status`, { timeout: 5000 });
    return response.data;
  } catch {
    return null;
  }
}

// Waits until the dev server reports an ok build after a config edit, and
// returns its build id. A developer mid-edit may leave the build broken for a
// while; past `timeoutMs` the run stops.
async function waitForOkBuild({ url, pollIntervalMs = 1000, timeoutMs = 300000 }) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await readBuildStatus({ url });
    if (status?.build?.status === 'ok') {
      return status.buildId;
    }
    await sleep(pollIntervalMs);
  }
  throw new Error(
    `The config build did not succeed within ${Math.round(
      timeoutMs / 1000
    )}s of an edit during the run. Rerun \`lowdefy journeys harden\` once it builds.`
  );
}

export default waitForOkBuild;
