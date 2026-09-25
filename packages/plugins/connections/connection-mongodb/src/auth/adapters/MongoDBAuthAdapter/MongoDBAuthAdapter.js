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

import { MongoClient } from 'mongodb';
import { ConfigError } from '@lowdefy/errors';

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
  // Process-lifetime client by design: getBetterAuth memoizes the engine (and
  // this adapter with it), the driver connects lazily and pools, and the
  // client is never closed by us. The driver does close it on a failed first
  // connect (a serverless instance frozen mid-handshake, a network blip) and
  // then keeps handing out the closed topology - every later operation throws
  // MongoTopologyClosedError for the life of the process. So the client is
  // replaced as soon as its topology closes: the request that hit the failed
  // connect errors, the next one connects afresh.
  let client;
  let db;
  function connect() {
    const current = new MongoClient(properties.uri, properties.mongoDBClientOptions);
    current.once('topologyClosed', () => {
      if (client === current) connect();
    });
    client = current;
    db = current.db(properties.database);
  }
  connect();
  // The vendored adapter only calls db.collection(model) per operation, so a
  // facade that resolves the current client's database is enough.
  return mongodbAdapter({ db: { collection: (name) => db.collection(name) } });
}

export default MongoDBAuthAdapter;
