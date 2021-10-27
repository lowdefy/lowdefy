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

import { ConfigurationError } from '../../context/errors';

async function loadConnection({ readConfigFile }, { request }) {
  const { connectionId, requestId } = request;

  if (!connectionId) {
    throw new ConfigurationError(`Request "${requestId}" does not specify a connection.`);
  }

  const connection = await readConfigFile(`connections/${connectionId}.json`);

  if (!connection) {
    throw new ConfigurationError(`Connection "${connectionId}" does not exist.`);
  }
  return connection;
}

export default loadConnection;
