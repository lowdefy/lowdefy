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

import { ConfigError } from '@lowdefy/errors';

import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import injectTenantIntoPipeline from '../tenant/injectTenantIntoPipeline.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

function checkOutAndMerge({ pipeline, connection }) {
  if (connection.write !== true) {
    pipeline.forEach((stage) => {
      if (stage.$out != null || stage.$merge != null) {
        throw new ConfigError(
          'Connection does not allow writes and aggregation pipeline contains a "$merge" or "$out" stage.'
        );
      }
    });
  }
}

async function MongodbAggregation({ request, connection, tenant }) {
  const deserializedRequest = deserialize(request);
  const { options } = deserializedRequest;
  let { pipeline } = deserializedRequest;
  checkOutAndMerge({ pipeline, connection });
  if (tenant) {
    // Recursive $match prepend over the whole pipeline tree - $lookup,
    // $unionWith, and $facet branches. First-stage-only entry stages and
    // $graphLookup are refused unless the verdict carries authored: true
    // (tenant: authored on the request), in which case the developer-authored
    // tenant clause is audited against the verdict instead. Also rejects
    // $out/$merge outright on tenant connections (they write whole
    // collections outside the stamp path, even when write is allowed).
    pipeline = injectTenantIntoPipeline({ pipeline, tenant });
  }
  const { collection } = await getCollection({ connection });
  let res;
  try {
    const cursor = await collection.aggregate(pipeline, options);
    res = await cursor.toArray();
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBAggregation' });
  }
  return serialize(res);
}

MongodbAggregation.schema = schema;
MongodbAggregation.meta = {
  checkRead: true,
  checkWrite: false,
};

export default MongodbAggregation;
