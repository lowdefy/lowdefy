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

import { type } from '@lowdefy/helpers';

import createTestLogger from './createTestLogger.js';
import createTestSecrets from './createTestSecrets.js';
import importBuildModule from './importBuildModule.js';
import importServerModule from './importServerModule.js';
import readBuildJson from './readBuildJson.js';
import readBuildSecretNames from './readBuildSecretNames.js';

async function load({ testApp }) {
  const { directories } = testApp;
  const { serializer } = testApp.modules.helpers;
  const [connections, steps, notifications, operators, jsMap, websockets, nodeUtils] =
    await Promise.all([
      importBuildModule({ directories, filePath: 'plugins/connections.js' }),
      importBuildModule({ directories, filePath: 'plugins/steps.js' }),
      importBuildModule({ directories, filePath: 'plugins/notifications.js' }),
      importBuildModule({ directories, filePath: 'plugins/operators/server.js' }),
      importBuildModule({ directories, filePath: 'plugins/operators/serverJsMap.js' }),
      importBuildModule({ directories, filePath: 'plugins/websockets.js' }),
      importServerModule({ directories, name: '@lowdefy/node-utils' }),
    ]);
  const secrets = createTestSecrets({
    names: readBuildSecretNames({ directories }),
    secrets: testApp.secrets,
  });
  return {
    // Closed by default: no agent type is loaded, so an agent call fails before it can reach a
    // model provider.
    agents: {},
    // The MongoDB connection plugin keeps its driver clients for the life of the process;
    // closing the app ends them (closeTestApp). An app without the plugin has none.
    closeClients: type.isNone(connections.default.MongoDBCollection)
      ? null
      : (await importServerModule({ directories, name: '@lowdefy/connection-mongodb/clients' }))
          .closeClients,
    config: readBuildJson({ directories, filePath: 'config.json', serializer }),
    connections: connections.default,
    i18n: readBuildJson({ directories, filePath: 'i18n.json', serializer }),
    interpolateProperties: notifications.interpolateProperties,
    jsMap: jsMap.default,
    logger: createTestLogger(),
    notifications: notifications.default,
    operators: operators.default,
    renderEmail: notifications.renderEmail,
    // env: {} so only the test secrets are scrubbed; the real CRON_SECRET is already gone.
    scrubSecrets: nodeUtils.createSecretScrubber({ secrets, env: {} }),
    secrets,
    steps: steps.default,
    websockets: websockets.default,
  };
}

// What every call of the app shares, loaded once, at the first session: the plugin maps the
// build wrote (the real connections, steps, notifications and operators, from the built
// server's own install), the built config, and the test secrets. The production server imports
// the same files in its request middleware; the access table needs none of them, so opening an
// app does not pay for them.
function loadSessionRuntime({ testApp }) {
  testApp.runtime = testApp.runtime ?? load({ testApp });
  return testApp.runtime;
}

export default loadSessionRuntime;
