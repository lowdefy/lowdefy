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

import getClient from '../../../connections/MongoDBCollection/getClient.js';
import mongodbAdapter from '../mongodbAdapter/mongodbAdapter.js';

// A thin wrapper around the vendored MongoDB adapter (see mongodbAdapter.js
// for provenance). The wrapper selects the database and nothing more - no
// app-scoping, no tenancy, no query interception. Physical collection names
// follow the fixed user-* mapping applied by the engine at startup; there is
// no modelName escape hatch. The adapter stores json additionalFields
// (user.attributes, member.attributes, invitation.attributes) as native
// sub-documents so native reads can filter and aggregate on attribute
// contents, and parses legacy JSON-string rows on read - native filtering on
// pre-release stringified rows still requires reshaping them to
// sub-documents (nothing shipped - a one-off script, no app-facing
// migration).
function MongoDBAuthAdapter({ properties }) {
  if (!properties.uri) {
    throw new ConfigError('MongoDBAuthAdapter requires "uri" property.');
  }
  // The client is cached for the process lifetime and shared with MongoDBCollection
  // connections on the same uri and options. It is resolved per operation because
  // getClient evicts a client whose connect failed (a serverless instance frozen
  // mid-handshake, a network blip): the request that hit the failed connect errors,
  // the next one connects afresh instead of reusing the dead client.
  async function getDb() {
    const client = await getClient({
      databaseUri: properties.uri,
      options: properties.mongoDBClientOptions,
    });
    return client.db(properties.database);
  }
  return mongodbAdapter({ getDb });
}

export default MongoDBAuthAdapter;
