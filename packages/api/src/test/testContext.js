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

import createAuthorizeOutcome from '../context/createAuthorizeOutcome.js';

function testContext({
  appMeta = {},
  auth,
  authEnforcement = null,
  config = {},
  configDirectory,
  connections = {},
  headers = {},
  logger = {
    debug: () => {},
    error: () => {},
    info: () => {},
    warn: () => {},
  },
  mode = 'prod',
  operators = {
    _test: () => 'test',
  },
  organization = null,
  readConfigFile,
  scrubSecrets = (value) => value,
  secrets = {},
  steps = {},
  system,
  user = null,
} = {}) {
  return {
    appMeta,
    auth,
    authEnforcement,
    authorizeOutcome: createAuthorizeOutcome({ authEnforcement, system, user }),
    config,
    configDirectory,
    connections,
    organization,
    system,
    // Mirrors the servers' createHandleError contract: the sink logs the error
    // and marks it handled, which is what runRoutine's guard and the client's
    // already-logged check both read.
    handleError: async (error) => {
      logger.error(error);
      error.handled = true;
    },
    headers,
    logger,
    mode,
    operators,
    readConfigFile,
    scrubSecrets,
    secrets,
    steps,
    user,
  };
}

export default testContext;
