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

import { ConfigurationError } from '../../context/errors.js';

async function getConnectionConfig({ logger, readConfigFile }, { requestConfig }) {
  const { connectionId, requestId } = requestConfig;
  let err;

  if (!connectionId) {
    err = new ConfigurationError(`Request "${requestId}" does not specify a connection.`);
    logger.debug({ params: { requestId }, err }, err.message);
    throw err;
  }

  const connection = await readConfigFile(`connections/${connectionId}.json`);

  if (!connection) {
    err = new ConfigurationError(`Connection "${connectionId}" does not exist.`);
    logger.debug({ params: { requestId }, err }, err.message);
    throw err;
  }
  return connection;
}

export default getConnectionConfig;
