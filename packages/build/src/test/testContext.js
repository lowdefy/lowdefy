/*
  Copyright 2020-2024 Lowdefy, Inc

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

import createCounter from '../utils/createCounter.js';

function testContext({ writeBuildArtifact, configDirectory, readConfigFile, logger = {} } = {}) {
  const defaultLogger = {
    info: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
    succeed: () => {},
  };

  const context = {
    stage: 'test',
    directories: {
      config: configDirectory || '',
    },
    entitlements: ['AUTH'],
    typeCounters: {
      actions: createCounter(),
      auth: {
        adapters: createCounter(),
        callbacks: createCounter(),
        events: createCounter(),
        providers: createCounter(),
      },
      blocks: createCounter(),
      connections: createCounter(),
      requests: createCounter(),
      operators: {
        client: createCounter(),
        server: createCounter(),
      },
    },
    writeBuildArtifact: writeBuildArtifact || (() => {}),
    readConfigFile: readConfigFile || (() => {}),
    refMap: {},
    keyMap: {},
    jsMap: {},
  };

  context.logger = {
    ...defaultLogger,
    ...logger,
  };
  return context;
}

export default testContext;
