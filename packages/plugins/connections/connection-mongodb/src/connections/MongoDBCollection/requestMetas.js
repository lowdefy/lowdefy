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

// Whether each request type reads and writes. The resolvers carry it as their
// meta (the api's read and write checks) and types.js as requestMetas (the
// build's tenant: none check), so both classify a request from this one table.
const requestMetas = {
  MongoDBAggregation: { checkRead: true, checkWrite: false },
  MongoDBBulkWrite: { checkRead: false, checkWrite: true },
  MongoDBDeleteMany: { checkRead: false, checkWrite: true },
  MongoDBDeleteOne: { checkRead: false, checkWrite: true },
  MongoDBEnrichmentClaim: { checkRead: true, checkWrite: true },
  MongoDBEnrichmentComplete: { checkRead: false, checkWrite: true },
  MongoDBEnrichmentEnqueue: { checkRead: false, checkWrite: true },
  MongoDBFind: { checkRead: true, checkWrite: false },
  MongoDBFindOne: { checkRead: true, checkWrite: false },
  MongoDBInsertConsecutiveId: { checkRead: false, checkWrite: true },
  MongoDBInsertMany: { checkRead: false, checkWrite: true },
  MongoDBInsertManyConsecutiveIds: { checkRead: false, checkWrite: true },
  MongoDBInsertOne: { checkRead: false, checkWrite: true },
  MongoDBTableChanges: { checkRead: false, checkWrite: true },
  MongoDBTableQuery: { checkRead: true, checkWrite: false },
  MongoDBUpdateMany: { checkRead: false, checkWrite: true },
  MongoDBUpdateOne: { checkRead: false, checkWrite: true },
  MongoDBVersionedUpdateOne: { checkRead: false, checkWrite: true },
};

export default requestMetas;
