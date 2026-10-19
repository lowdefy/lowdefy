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

import { parentPort, workerData } from 'node:worker_threads';

import importPluginModule from './importPluginModule.js';

// Reads the static schema fields off a connection package's exports. Only
// JSON crosses back to the build: the request functions themselves cannot be
// posted, and their drivers stay in this thread, which exits.
function extractSchemas(packageConnections) {
  const connections = {};
  const requests = {};
  for (const [typeName, connection] of Object.entries(packageConnections)) {
    connections[typeName] = {
      schema: connection?.schema,
      requests: Object.keys(connection?.requests ?? {}),
    };
    for (const [requestName, requestFn] of Object.entries(connection?.requests ?? {})) {
      requests[requestName] = { schema: requestFn?.schema, meta: requestFn?.meta };
    }
  }
  return JSON.parse(JSON.stringify({ connections, requests }));
}

const { packageNames, serverDirectory } = workerData;
const context = { directories: { server: serverDirectory } };
const collected = {};
for (const packageName of packageNames) {
  // A module that fails while loading throws here and fails the build, as
  // the in-process import did.
  const packageConnections = await importPluginModule({
    context,
    specifier: `${packageName}/connections`,
  });
  collected[packageName] =
    packageConnections === undefined ? null : extractSchemas(packageConnections);
}
parentPort.postMessage(collected);
