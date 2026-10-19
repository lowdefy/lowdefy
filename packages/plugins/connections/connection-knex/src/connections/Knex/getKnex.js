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

import createKnex from './createKnex.js';

// Each knex instance owns a connection pool, so an instance per request opened a new pool every
// time and never released it. Instances are cached for the lifetime of the process, keyed by the
// connection config, so requests to the same database share one pool.
const knexClients = new Map();

function getKnex(connection) {
  const key = JSON.stringify(connection);
  if (!knexClients.has(key)) {
    knexClients.set(key, createKnex(connection));
  }
  return knexClients.get(key);
}

async function destroyKnexClients() {
  const clients = [...knexClients.values()];
  knexClients.clear();
  await Promise.all(clients.map((client) => client.destroy()));
}

export { destroyKnexClients };
export default getKnex;
