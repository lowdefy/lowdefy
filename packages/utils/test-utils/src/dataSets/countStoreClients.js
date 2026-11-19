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

// The connections to the store from any client but the keeper's own, which names itself with
// `keeperAppName`. mongod's own threads have no client address and are not counted. A test
// process holds its client from its first session until it closes its test app (closeTestApp)
// or exits, and a process that has exited, however it ended, has no connection left, so a count
// of 0 means no test process uses the store. The driver gives no time limit here (timeoutMS is a
// no-op in mongodb 7), so the keeper bounds the count itself (runDataStoreKeeper).
async function countStoreClients({ client, keeperAppName }) {
  const operations = await client
    .db('admin')
    .aggregate([{ $currentOp: { allUsers: true, idleConnections: true } }])
    .toArray();
  return operations.filter(
    (operation) => operation.client !== undefined && operation.appName !== keeperAppName
  ).length;
}

export default countStoreClients;
