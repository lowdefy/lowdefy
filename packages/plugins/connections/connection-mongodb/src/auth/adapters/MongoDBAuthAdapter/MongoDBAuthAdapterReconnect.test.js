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

import { jest } from '@jest/globals';

const mockMongodbAdapter = jest.fn(({ db }) => db);

jest.unstable_mockModule('../mongodbAdapter/mongodbAdapter.js', () => ({
  default: mockMongodbAdapter,
}));

// Real driver, unreachable server: the first operation's auto-connect fails and
// the driver closes the client's topology. Without a replacement client every
// later operation throws MongoTopologyClosedError instead of trying again.
test('MongoDBAuthAdapter connects afresh after a failed first connect', async () => {
  const { default: MongoDBAuthAdapter } = await import('./MongoDBAuthAdapter.js');
  const db = MongoDBAuthAdapter({
    properties: {
      uri: 'mongodb://127.0.0.1:1/?directConnection=true',
      database: 'auth',
      mongoDBClientOptions: { serverSelectionTimeoutMS: 100, connectTimeoutMS: 100 },
    },
  });
  const findUser = () => db.collection('user').findOne({ email: 'a@example.com' });
  await expect(findUser()).rejects.toMatchObject({ name: 'MongoServerSelectionError' });
  await expect(findUser()).rejects.toMatchObject({ name: 'MongoServerSelectionError' });
});
