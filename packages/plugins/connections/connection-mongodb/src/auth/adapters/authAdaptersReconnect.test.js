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

import MongoDBAdapter from './MongoDBAdapter/MongoDBAdapter.js';
import MultiAppMongoDBAdapter from './MultiAppMongoDBAdapter/MultiAppMongoDBAdapter.js';

// Real driver, unreachable server: the first operation's connect fails and the
// driver closes the client's topology. Without a replacement client every later
// operation fails for the life of the process instead of trying again - with
// MongoTopologyClosedError, or by re-throwing the first error from a rejected
// connect promise. The second failure must come from a fresh connect attempt.
async function expectFreshConnectFailures(getUser) {
  const first = await getUser().catch((error) => error);
  const second = await getUser().catch((error) => error);
  expect(first).toMatchObject({ name: 'MongoServerSelectionError' });
  expect(second).toMatchObject({ name: 'MongoServerSelectionError' });
  expect(second).not.toBe(first);
}

const properties = {
  appName: 'test-app',
  databaseUri: 'mongodb://127.0.0.1:1/auth?directConnection=true',
  mongoDBClientOptions: { serverSelectionTimeoutMS: 100, connectTimeoutMS: 100 },
};

test('MongoDBAdapter connects afresh after a failed first connect', async () => {
  const adapter = MongoDBAdapter({ properties });
  await expectFreshConnectFailures(() => adapter.getUserByEmail('a@example.com'));
});

test('MultiAppMongoDBAdapter connects afresh after a failed first connect', async () => {
  const adapter = MultiAppMongoDBAdapter({ properties });
  await expectFreshConnectFailures(() => adapter.getUserByEmail('a@example.com'));
});
