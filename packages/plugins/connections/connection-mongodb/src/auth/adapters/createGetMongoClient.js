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

// Auth adapters live for the process lifetime (getAuthConfig memoizes them), the
// driver connects lazily and pools, and the client is never closed by us. The
// driver does close it on a failed first connect (a serverless instance frozen
// mid-handshake, a network blip) and then keeps handing out the closed topology -
// every later operation throws MongoTopologyClosedError for the life of the
// process. So the client is replaced as soon as its topology closes: the request
// that hit the failed connect errors, the next one connects afresh.
function createGetMongoClient({ databaseUri, mongoDBClientOptions }) {
  let client;
  function connect() {
    const current = new MongoClient(databaseUri, mongoDBClientOptions);
    current.once('topologyClosed', () => {
      if (client === current) connect();
    });
    client = current;
  }
  connect();
  return function getMongoClient() {
    return client;
  };
}

export default createGetMongoClient;
