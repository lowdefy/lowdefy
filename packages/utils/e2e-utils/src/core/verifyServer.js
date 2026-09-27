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

import fs from 'fs';

async function readIdentity({ port }) {
  let response;
  try {
    response = await fetch(`http://localhost:${port}/api/e2e/identity`, {
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    throw new Error(`Could not reach the e2e server on port ${port}: ${error.message}`);
  }
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

// Playwright reuses whatever server listens on the port. Only this app's e2e build applies
// the request mocks and e2e session, so any other server (lowdefy dev, a production build,
// another checkout's e2e server) must stop the run instead of being tested by accident.
async function verifyServer({ buildDir, port }) {
  const identity = await readIdentity({ port });
  const change = `Stop that server or set another \`port\` in the Playwright config`;
  if (identity?.server !== 'lowdefy-e2e') {
    throw new Error(
      `Port ${port} is in use by a server that is not a Lowdefy e2e server, for example \`lowdefy dev\`. ${change}, so the tests run against this app's e2e build.`
    );
  }
  const expected = fs.existsSync(buildDir) ? fs.realpathSync(buildDir) : buildDir;
  if (identity.buildDirectory !== expected) {
    throw new Error(
      `Port ${port} is in use by the Lowdefy e2e server of another app or checkout, which serves ${identity.buildDirectory}. ${change}, so the tests run against this app's e2e build in ${expected}.`
    );
  }
}

export default verifyServer;
