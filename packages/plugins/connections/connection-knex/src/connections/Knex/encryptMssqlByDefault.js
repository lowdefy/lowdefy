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

// knex's mssql dialect turns encryption off unless the app sets it, although tedious encrypts by
// default, so an unconfigured connection sent the login and every query in plaintext. knex reads
// encrypt from the connection (where a connection string's ?encrypt= lands) and lets
// connection.options override it, so the default goes in options, which nothing overrides.
function encryptMssqlByDefault(knexClient) {
  const settings = knexClient.client.connectionSettings;
  if (!type.isNone(settings.encrypt) || !type.isNone(settings.options?.encrypt)) {
    return knexClient;
  }
  settings.options = { ...settings.options, encrypt: true };
  return knexClient;
}

export default encryptMssqlByDefault;
