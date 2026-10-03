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

import dataSessionRegistry from './dataSessionRegistry.js';

// Drops every session database on the store that no registered session owns: one left behind by a
// write that was still in flight when its session dropped the database, or by a dev server that
// stopped mid-run.
async function sweepOrphanDatabases({ client }) {
  const owned = new Set([...dataSessionRegistry.values()].map((session) => session.databaseName));
  const { databases } = await client.db('admin').admin().listDatabases({ nameOnly: true });
  await Promise.all(
    databases
      .map((database) => database.name)
      .filter((name) => name.startsWith('ld_') && !owned.has(name))
      .map((name) => client.db(name).dropDatabase())
  );
}

export default sweepOrphanDatabases;
