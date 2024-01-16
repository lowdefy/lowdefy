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

import createAuthorize from '../context/createAuthorize.js';

function testContext({
  config = {},
  connections = {},
  headers = {},
  logger = {
    debug: () => {},
    error: () => {},
    info: () => {},
    warn: () => {},
  },
  operators = {
    _test: () => 'test',
  },
  readConfigFile,
  secrets = {},
  session,
} = {}) {
  return {
    authorize: createAuthorize({ session }),
    config,
    connections,
    headers,
    logger,
    operators,
    readConfigFile,
    secrets,
    session,
  };
}

export default testContext;
