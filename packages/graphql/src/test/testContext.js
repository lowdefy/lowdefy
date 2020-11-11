/*
  Copyright 2020 Lowdefy, Inc

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

import createGetController from '../context/getController';

function testBootstrapContext({ loaders, getConnectionSecrets } = {}) {
  const bootstrapContext = {
    DEPLOYMENT_ID: 'test',
    DEPLOYMENT_NAME: 'Test App',
    DOMAIN_NAME: 'test.com',
    CONFIGURATION_BASE_PATH: 'CONFIGURATION_BASE_PATH',
    ORIGIN: 'test.com',
    HOST: 'test.com',
    getLoader: loaders ? (name) => loaders[name] : () => {},
    getController: () => {},
    getConnectionSecrets: getConnectionSecrets || (() => {}),
    logger: { log: () => {} },
  };
  bootstrapContext.getController = createGetController(bootstrapContext);
  return bootstrapContext;
}

function testContext({ loaders } = {}) {
  const bootstrapContext = {
    DEPLOYMENT_ID: 'test',
    DEPLOYMENT_NAME: 'Test App',
    DOMAIN_NAME: 'test.com',
    ORIGIN: 'test.com',
    HOST: 'test.com',
    getLoader: (name) => loaders[name],
    getConnectionSecrets: () => {},
    logger: { log: () => {} },
  };
  bootstrapContext.getController = createGetController(bootstrapContext);
  return {
    getController: bootstrapContext.getController,
    logger: bootstrapContext.logger,
  };
}

export { testBootstrapContext, testContext };
