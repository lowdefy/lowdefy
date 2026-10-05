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
import { ConfigError } from '@lowdefy/errors';

import tenantTargetKey from './tenantTargetKey.js';

// Best-effort DX check, like validateTenantPipelineEntry: literal pipelines
// only. A tenant: shared connection runs aggregations with no tenant guard, so
// an $out or $merge into a collection a scoped connection reads would write
// rows no check has seen - a row without the tenant field is invisible to
// every walled read and makes the tenant preflight refuse to serve the app.
// The build refuses the literal case. A target named by an operator, or in
// another database ({ db, coll }), can not be resolved here and passes.
//
// MongoDB only runs $out and $merge as the last stage of the root pipeline,
// so only the root stages are read.
function getLiteralWriteTarget(stage) {
  if (!type.isObject(stage)) {
    return null;
  }
  if (type.isString(stage.$out)) {
    return { operator: '$out', collection: stage.$out };
  }
  if (type.isString(stage.$merge)) {
    return { operator: '$merge', collection: stage.$merge };
  }
  if (type.isString(stage.$merge?.into)) {
    return { operator: '$merge', collection: stage.$merge.into };
  }
  return null;
}

function validateSharedPipelineWrite({
  config,
  location,
  sharedTargets,
  walledTargets,
  configKey,
}) {
  const shared = sharedTargets?.get(config.connectionId);
  if (type.isNone(shared)) {
    return;
  }
  const pipeline = config.properties?.pipeline;
  if (!type.isArray(pipeline)) {
    return;
  }
  pipeline.forEach((stage) => {
    const write = getLiteralWriteTarget(stage);
    if (write === null) {
      return;
    }
    const walled = walledTargets.get(
      tenantTargetKey({
        connection: shared.connection,
        tenantTarget: shared.tenantTarget,
        collection: write.collection,
      })
    );
    if (type.isNone(walled)) {
      return;
    }
    throw new ConfigError(
      `${location} writes into collection "${write.collection}" with "${write.operator}" on tenant: shared connection "${config.connectionId}", but scoped connection "${walled.connectionId}" reads that collection. Rows an aggregation writes are not checked for a non-empty "${walled.field}", and a row without it is invisible to every walled read and makes the tenant preflight refuse to serve the app. Return the documents and write them with MongoDBInsertMany or MongoDBBulkWrite on connection "${walled.connectionId}", which stamps every row with the caller's organization (from a system run, call an endpoint with a CallApi step that names the "organization").`,
      { configKey }
    );
  });
}

export default validateSharedPipelineWrite;
