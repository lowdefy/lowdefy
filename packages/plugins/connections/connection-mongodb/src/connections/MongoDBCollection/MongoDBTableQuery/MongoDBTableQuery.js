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

import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import injectTenantIntoPipeline from '../tenant/injectTenantIntoPipeline.js';
import { assertUnscopedPipeline } from '../tenant/guardUnscopedWrite.js';
import { serialize, deserialize } from '../serialize.js';
import compileTableQuery from './compileTableQuery.js';
import readTableResult from './readTableResult.js';
import schema from './schema.js';

// Server mode for the Table block: the view the browser sends is validated against the
// `fields` allowlist and compiled to one aggregation on the server. The browser never
// sends MongoDB syntax.
async function MongoDBTableQuery({ request, connection, tenant, tenantGuard }) {
  const properties = deserialize(request);
  const compiled = compileTableQuery({ properties, now: new Date() });
  let { pipeline } = compiled;
  if (tenant) {
    pipeline = injectTenantIntoPipeline({ pipeline, tenant });
  }
  if (tenantGuard) {
    assertUnscopedPipeline({ pipeline, field: tenantGuard.field });
  }
  const { collection } = await getCollection({ connection });
  let result;
  try {
    const cursor = await collection.aggregate(pipeline, properties.options);
    result = await cursor.toArray();
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBTableQuery' });
  }
  return serialize(readTableResult({ result, grouped: compiled.grouped, specs: compiled.specs }));
}

MongoDBTableQuery.schema = schema;
MongoDBTableQuery.meta = {
  checkRead: true,
  checkWrite: false,
};

export default MongoDBTableQuery;
