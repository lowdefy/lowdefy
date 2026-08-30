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

// Best-effort DX check, NOT the enforcement gate. The tenant wall prepends a
// tenant $match at every pipeline entry - the root and every $lookup /
// $unionWith sub-pipeline, recursing through $facet (see
// connection-mongodb injectTenantIntoPipeline.js). A collection declared
// tenant: shared carries no tenant field, so a scoped pipeline that joins it
// gets a sub-pipeline filter the collection can never satisfy: the join
// returns [] with no error anywhere. The build has both halves of the fact -
// which connections are walled, and which collection each connection names -
// so it refuses the literal case here. Request properties are
// operator-evaluated, so an operator-composed stage or collection name is
// invisible at build and passes silently; that is not warned on, because a
// warning on every dynamic pipeline is noise.
//
// Unlike validateTenantPipelineEntry this does NOT skip `tenant: authored`:
// authored exempts only the entry stages and $graphLookup, and the rest of
// an authored pipeline - every $lookup/$unionWith sub-pipeline - is still
// walled mechanically, so the empty join happens regardless.
//
// Sharedness has two sources. The app-level collections: declaration
// (context.collections, build/collections.json) is authoritative when it
// names the collection - a collection declared tenant: shared is shared even
// when no connection for it exists in this app. The connection-derived
// tenantCollectionMap is the fallback, so apps without collections: behave
// exactly as before.

function collectCollectionStages(pipeline, found) {
  if (!type.isArray(pipeline)) {
    return;
  }
  pipeline.forEach((stage) => {
    if (!type.isObject(stage)) {
      return;
    }
    if (type.isObject(stage.$lookup)) {
      if (type.isString(stage.$lookup.from)) {
        found.push({ collection: stage.$lookup.from, stageKey: '$lookup' });
      }
      collectCollectionStages(stage.$lookup.pipeline, found);
    }
    if (type.isString(stage.$unionWith)) {
      found.push({ collection: stage.$unionWith, stageKey: '$unionWith' });
    }
    if (type.isObject(stage.$unionWith)) {
      if (type.isString(stage.$unionWith.coll)) {
        found.push({ collection: stage.$unionWith.coll, stageKey: '$unionWith' });
      }
      collectCollectionStages(stage.$unionWith.pipeline, found);
    }
    if (type.isObject(stage.$graphLookup) && type.isString(stage.$graphLookup.from)) {
      found.push({ collection: stage.$graphLookup.from, stageKey: '$graphLookup' });
    }
    if (type.isObject(stage.$facet)) {
      Object.values(stage.$facet).forEach((branch) => {
        collectCollectionStages(branch, found);
      });
    }
  });
}

function validateTenantSharedLookup({
  config,
  location,
  tenantConnections,
  tenantCollectionMap,
  collections,
  configKey,
}) {
  if (config.tenant === 'none') {
    return;
  }
  if (!tenantConnections || !tenantConnections.has(config.connectionId)) {
    return;
  }
  const pipeline = config.properties?.pipeline;
  if (!type.isArray(pipeline)) {
    return;
  }
  const found = [];
  collectCollectionStages(pipeline, found);
  found.forEach(({ collection, stageKey }) => {
    const declared = collections?.[collection];
    if (!type.isUndefined(declared?.tenant)) {
      if (declared.tenant !== 'shared') {
        return;
      }
      const sharedConnectionId = declared.connections.find(
        (joined) => joined.tenant === 'shared'
      )?.connectionId;
      const owner = type.isUndefined(sharedConnectionId)
        ? 'is declared tenant: shared in collections:'
        : `is declared tenant: shared in collections: and belongs to connection "${sharedConnectionId}"`;
      throw new ConfigError(
        `${location} uses "${stageKey}" on collection "${collection}" over tenant connection "${
          config.connectionId
        }". Collection "${collection}" ${owner}, so it carries no tenant field. The wall prepends a tenant $match into every $lookup/$unionWith sub-pipeline, so this stage will match nothing and the join returns []. ${fixMessage(
          { config, sharedConnectionId }
        )}`,
        { configKey, checkSlug: 'tenant-lookup' }
      );
    }
    const shared = tenantCollectionMap?.[collection]?.shared ?? [];
    if (shared.length === 0) {
      return;
    }
    const [sharedConnectionId, ...rest] = shared;
    const also = rest.length > 0 ? ` (also declared on: ${rest.join(', ')})` : '';
    throw new ConfigError(
      `${location} uses "${stageKey}" on collection "${collection}" over tenant connection "${
        config.connectionId
      }". Collection "${collection}" belongs to connection "${sharedConnectionId}"${also}, which is declared tenant: shared, so it carries no tenant field. The wall prepends a tenant $match into every $lookup/$unionWith sub-pipeline, so this stage will match nothing and the join returns []. ${fixMessage(
        { config, sharedConnectionId }
      )}`,
      { configKey, checkSlug: 'tenant-lookup' }
    );
  });
}

function fixMessage({ config, sharedConnectionId }) {
  const target = type.isUndefined(sharedConnectionId)
    ? 'a tenant: shared connection for it'
    : `"${sharedConnectionId}"`;
  if (config.tenant === 'authored') {
    return `Move this stage onto ${target} and pass the organization facts in through the request payload — "tenant: authored" exempts only entry stages and $graphLookup, not $lookup sub-pipelines.`;
  }
  return `Run the pipeline on ${target} and pass the organization facts in through the request payload, or declare tenant: authored on this request and author the organization clause yourself.`;
}

export default validateTenantSharedLookup;
