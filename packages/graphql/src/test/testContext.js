/*
  Copyright 2020-2021 Lowdefy, Inc

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

import createGetController from '../controllers/getController';

function testBootstrapContext({ development, getSecrets, host, loaders, setHeader, user } = {}) {
  const bootstrapContext = {
    CONFIGURATION_BASE_PATH: 'CONFIGURATION_BASE_PATH',
    development,
    getController: () => {},
    getLoader: loaders ? (name) => loaders[name] : () => {},
    getSecrets: getSecrets || (() => {}),
    host: host || 'host',
    logger: { log: () => {} },
    setHeader: setHeader || (() => {}),
    user: user || {},
  };
  bootstrapContext.getController = createGetController(bootstrapContext);
  return bootstrapContext;
}

function testContext({ development, getSecrets, host, loaders, setHeader, user } = {}) {
  const bootstrapContext = {
    development,
    getLoader: (name) => loaders[name],
    getSecrets: getSecrets || (() => {}),
    host: host || 'host',
    logger: { log: () => {} },
    setHeader: setHeader || (() => {}),
    user: user || {},
  };
  bootstrapContext.getController = createGetController(bootstrapContext);
  return {
    getController: bootstrapContext.getController,
    logger: bootstrapContext.logger,
  };
}

export { testBootstrapContext, testContext };
