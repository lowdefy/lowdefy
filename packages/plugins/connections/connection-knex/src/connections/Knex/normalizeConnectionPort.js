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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// knex hands connectionSettings.port to the driver as it received it, and a port
// parsed from a connection string or read from a _secret arrives as a string.
// tedious (mssql) refuses a string port, so coerce it once for every client.
function normalizeConnectionPort(knexClient) {
  const settings = knexClient.client?.connectionSettings;
  if (!type.isObject(settings) || !type.isString(settings.port)) {
    return knexClient;
  }
  const port = Number(settings.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(
      `Knex connection port is not a valid port number. Received ${JSON.stringify(settings.port)}.`
    );
  }
  settings.port = port;
  return knexClient;
}

export default normalizeConnectionPort;
