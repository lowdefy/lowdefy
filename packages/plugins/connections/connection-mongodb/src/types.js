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

export default {
  connections: ['MongoDBCollection'],
  // MongoDBCollection implements the tenant scoping contract: the tenant wall
  // (connection-level `tenant:`) is enforced across all its request types and
  // the change stream. Declaring `tenant:` on a connection type without this
  // meta is a build error.
  connectionMetas: {
    MongoDBCollection: { tenant: true },
  },
  requests: [
    'MongoDBAggregation',
    'MongoDBBulkWrite',
    'MongoDBDeleteMany',
    'MongoDBDeleteOne',
    'MongoDBFind',
    'MongoDBFindOne',
    'MongoDBInsertConsecutiveId',
    'MongoDBInsertMany',
    'MongoDBInsertManyConsecutiveIds',
    'MongoDBInsertOne',
    'MongoDBUpdateMany',
    'MongoDBUpdateOne',
    'MongoDBVersionedUpdateOne',
  ],
  auth: {
    adapters: ['MongoDBAuthAdapter'],
  },
  websockets: ['MongoDBChangeStream'],
};
