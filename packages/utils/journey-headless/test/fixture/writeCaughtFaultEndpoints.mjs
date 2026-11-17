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

// A step type for the copy's auth steps. The routine runner refuses an auth step for want of an
// auth engine before it reads the step type, so this never runs.
const stepsModule = `async function AddMember() {
  throw new Error('The build host has no auth engine, so no auth step runs.');
}
AddMember.meta = { authority: { scope: 'system' } };

export default { AddMember };
`;

function writeEndpoint({ endpointId, routine, serverDirectory }) {
  fs.writeFileSync(
    path.join(serverDirectory, 'build', 'api', `${endpointId}.json`),
    JSON.stringify({
      id: `endpoint:${endpointId}`,
      type: 'Api',
      auth: { public: true },
      endpointId,
      routine,
    })
  );
}

function detachedStep({ endpointId }) {
  return {
    id: `endpoint:${endpointId}:call_detached_log`,
    type: 'CallApi',
    stepId: 'call_detached_log',
    endpointId,
    properties: { endpointId: 'detached_log', detached: true },
  };
}

function authStep({ endpointId }) {
  return {
    id: `auth:${endpointId}:add_member`,
    type: 'AddMember',
    stepId: 'add_member',
    endpointId,
    properties: { userId: 'u_member' },
  };
}

// What the build host cannot do, in routines that catch the failure and routines that do not,
// written into a copy of the journey-fixture build: a detached CallApi (the host has no
// CRON_SECRET) and an auth step (it has no auth engine). The app's own `notify` endpoint already
// makes a detached call no :catch handles.
function writeCaughtFaultEndpoints({ serverDirectory }) {
  fs.writeFileSync(path.join(serverDirectory, 'build', 'plugins', 'steps.js'), stepsModule);
  writeEndpoint({
    endpointId: 'caught_detached',
    serverDirectory,
    routine: [
      {
        ':try': [detachedStep({ endpointId: 'caught_detached' })],
        ':catch': [{ ':log': { event: 'detached_call_refused' } }],
      },
      { ':return': { ok: true } },
    ],
  });
  writeEndpoint({
    endpointId: 'caught_auth',
    serverDirectory,
    routine: [
      {
        ':try': [authStep({ endpointId: 'caught_auth' })],
        ':catch': [{ ':log': { event: 'auth_step_refused' } }],
      },
      { ':return': { ok: true } },
    ],
  });
  writeEndpoint({
    endpointId: 'uncaught_auth',
    serverDirectory,
    routine: [authStep({ endpointId: 'uncaught_auth' }), { ':return': { ok: true } }],
  });
}

export default writeCaughtFaultEndpoints;
