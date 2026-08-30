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

import loadMemoryMongo from './loadMemoryMongo.js';

function getSeededConnectionIds({ items }) {
  const ids = new Set();
  items.forEach(({ test }) => {
    Object.keys(test?.seed ?? {}).forEach((id) => ids.add(id));
  });
  return [...ids];
}

// Runs once before the dev server boots. When any selected request test seeds
// data, starts an in-memory MongoDB and returns the env that points every seeded
// connection at it (read by @lowdefy/server-dev's applyConnectionOverrides).
// Returns { env, client, stop }; with nothing to seed the env is empty and stop
// is a no-op.
async function prepareRequestTests({ context, items }) {
  const connectionIds = getSeededConnectionIds({ items });
  if (connectionIds.length === 0) {
    return { env: {}, client: null, stop: async () => {} };
  }
  if (type.isString(context.options.url) && context.options.url !== '') {
    throw new Error(
      'Seeded request tests need a server this command started; --url targets a server whose connections it cannot redirect.'
    );
  }
  const { MongoMemoryServer, MongoClient } = await loadMemoryMongo({
    configDirectory: context.directories.config,
  });
  context.logger.info('Starting in-memory MongoDB for seeded request tests.');
  const memoryServer = await MongoMemoryServer.create();
  const databaseUri = memoryServer.getUri();
  const client = new MongoClient(databaseUri);
  await client.connect();
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
    stop,
  };
}

export default prepareRequestTests;
