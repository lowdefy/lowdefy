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

import MongoDBAggregation from './MongoDBAggregation/MongoDBAggregation.js';
import MongoDBBulkWrite from './MongoDBBulkWrite/MongoDBBulkWrite.js';
import MongoDBCreateIndexes from './MongoDBCreateIndexes/MongoDBCreateIndexes.js';
import MongoDBDeleteMany from './MongoDBDeleteMany/MongoDBDeleteMany.js';
import MongoDBDeleteOne from './MongoDBDeleteOne/MongoDBDeleteOne.js';
import MongoDBFind from './MongoDBFind/MongoDBFind.js';
import MongoDBFindOne from './MongoDBFindOne/MongoDBFindOne.js';
import MongoDBInsertConsecutiveId from './MongoDBInsertConsecutiveId/MongoDBInsertConsecutiveId.js';
import MongoDBInsertMany from './MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertManyConsecutiveIds from './MongoDBInsertManyConsecutiveIds/MongoDBInsertManyConsecutiveIds.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBUpdateMany from './MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from './MongoDBUpdateOne/MongoDBUpdateOne.js';
import MongoDBVersionedUpdateOne from './MongoDBVersionedUpdateOne/MongoDBVersionedUpdateOne.js';
import schema from './schema.js';
import tenantPreflight from './tenant/tenantPreflight.js';

export default {
  schema,
  // MongoDBCollection implements the tenant scoping contract: the request
  // layer passes the resolved tenant verdict ({ field, value }) to every
  // resolver, which stamps writes, merges filters, and injects pipeline
  // matches. The runtime check in resolveTenant reads this meta; the build
  // check reads connectionMetas in types.js.
  meta: {
    tenant: true,
  },
  // The tenant-preflight capability: the server probes every walled
  // collection for unstamped rows before serving under policy: tenant
  // (resolveTenantPreflight in @lowdefy/api).
  tenantPreflight,
  requests: {
    MongoDBAggregation,
    MongoDBBulkWrite,
    MongoDBCreateIndexes,
    MongoDBDeleteMany,
    MongoDBDeleteOne,
    MongoDBFind,
    MongoDBFindOne,
    MongoDBInsertConsecutiveId,
    MongoDBInsertMany,
    MongoDBInsertManyConsecutiveIds,
    MongoDBInsertOne,
    MongoDBUpdateMany,
    MongoDBUpdateOne,
    MongoDBVersionedUpdateOne,
  },
};
