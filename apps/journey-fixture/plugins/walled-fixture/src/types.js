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

// A plugin connection type for the journey fixture app
// (packages/servers/server-dev/test/journeyFixture/walled.test.mjs). It holds
// no database address: it names a walled MongoDBCollection connection and
// reaches MongoDB only through the walled client, so it declares
// meta.dataSet 'walled'.
export default {
  connections: ['WalledFixture'],
  connectionMetas: {
    WalledFixture: { tenant: false },
  },
  requests: ['WalledFixtureInsert'],
};
