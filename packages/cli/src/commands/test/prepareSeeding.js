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

import loadFixtures from './loadFixtures.js';
import loadMemoryMongo from './loadMemoryMongo.js';

// Every connection a test writes to, through its own `seed:` or through a fixture
// it names - all of them must be redirected at the memory server, or a fixture
// would land in the developer's real database.
function getSeededConnectionIds({ seeds, fixtures }) {
  const ids = new Set();
  seeds.forEach(({ seed }) => {
    Object.keys(seed ?? {}).forEach((id) => ids.add(id));
  });
  fixtures.forEach(({ fixture }) => {
    (fixture?.connections ?? []).forEach(({ connectionId }) => ids.add(connectionId));
  });
  return [...ids];
}

// Runs once before the dev server boots, for the whole run: journeys and request
// tests share one database, so they share one seeding session. `seeds` is what
// each selected test declares - { seed, fixtures } - in run order. When anything
// is seeded, starts an in-memory MongoDB and returns the env that points every
// seeded connection at it (read by @lowdefy/server-dev's applyConnectionOverrides).
// Returns { env, client, fixtures, ObjectId, seeded, stop }; with nothing to seed
// the env is empty and stop is a no-op. `fixtures` maps every fixture name the
// tests use to its loaded documents (or its load error) for the runners.
async function prepareSeeding({ context, seeds }) {
  const fixtures = await loadFixtures({ context, seeds });
  const connectionIds = getSeededConnectionIds({ seeds, fixtures });
  if (connectionIds.length === 0) {
    return { env: {}, client: null, fixtures, seeded: new Map(), stop: async () => {} };
  }
  if (type.isString(context.options.url) && context.options.url !== '') {
    throw new Error(
      'Seeded tests need a server this command started; --url targets a server whose connections it cannot redirect.'
    );
  }
  const { MongoMemoryServer, MongoClient, ObjectId } = await loadMemoryMongo({
    configDirectory: context.directories.config,
  });
  context.logger.info('Starting in-memory MongoDB for seeded tests.');
  const memoryServer = await MongoMemoryServer.create();
  const databaseUri = memoryServer.getUri();
  const client = new MongoClient(databaseUri);
  try {
    await client.connect();
  } catch (error) {
    // The mongod process outlives this command unless it is stopped here.
    await memoryServer.stop();
    throw error;
  }
  const overrides = {};
  connectionIds.forEach((connectionId) => {
    overrides[connectionId] = { databaseUri };
  });
  async function stop() {
    await client.close();
    await memoryServer.stop();
  }
  return {
    env: { LOWDEFY_TEST_CONNECTION_OVERRIDES: JSON.stringify(overrides) },
    client,
    fixtures,
    ObjectId,
    // Every collection any test in this run has seeded, so each test starts from
    // a database holding only its own data no matter what ran before it.
    seeded: new Map(),
    stop,
  };
}

export default prepareSeeding;
