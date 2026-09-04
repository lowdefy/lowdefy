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

// Best-effort DX check, NOT the enforcement gate: one recursive walk of an
// aggregation pipeline on a walled connection, raising at build every refusal
// the tenant wall raises at request time for a literal pipeline. The runtime
// (connection-mongodb injectTenantIntoPipeline.js) is the contract; request
// properties are operator-evaluated, so an operator-composed stage or
// collection name is invisible here and passes silently. That is not warned
// on, because a warning on every dynamic pipeline is noise.
//
// The four findings, all under the `tenant-lookup` slug:
//
// 1. A join onto a `tenant: shared` collection. The wall prepends a tenant
//    $match at every pipeline entry - the root and every $lookup / $unionWith
//    sub-pipeline, recursing through $facet - so a sub-pipeline reading a
//    collection that carries no tenant field matches nothing: the join
//    returns [] with no error anywhere. This does NOT skip `tenant: authored`:
//    authored exempts only entry stages and $graphLookup; the rest of an
//    authored pipeline is still walled mechanically.
// 2. $graphLookup at any depth without `tenant: authored`. The traversal
//    reads its target collection by name, so the entry $match does not
//    constrain it and the wall refuses the stage.
// 3. $out / $merge / $collStats / $indexStats anywhere - refused at runtime
//    on every walled connection, authored or not.
// 4. A first-stage-only entry stage ($search, $searchMeta, $vectorSearch,
//    $geoNear) at the entry of the root pipeline or of any $lookup /
//    $unionWith sub-pipeline, without `tenant: authored` - nothing can be
//    prepended before it.
//
// Sharedness has two sources. The app-level collections: declaration
// (context.collections, build/collections.json) is authoritative when it names
// the collection - a collection declared tenant: shared is shared even when no
// connection for it exists in this app. The connection-derived
// tenantCollectionMap is the fallback, so apps without collections: behave
// exactly as before.
//
// Findings are returned, not thrown: one pipeline can hold several, and the
// call site decides how they are collected.

const AUTHORED_ENTRY_STAGES = ['$search', '$searchMeta', '$vectorSearch', '$geoNear'];

const REFUSED_STAGES = {
  $out: '"$out" and "$merge" write whole collections outside the tenant stamp path',
  $merge: '"$out" and "$merge" write whole collections outside the tenant stamp path',
  $collStats: 'collection-level statistics can not be tenant-scoped',
  $indexStats: 'collection-level statistics can not be tenant-scoped',
};

function fixMessage({ config, sharedConnectionId }) {
  const target = type.isUndefined(sharedConnectionId)
    ? 'a tenant: shared connection for it'
    : `"${sharedConnectionId}"`;
  if (config.tenant === 'authored') {
    return `Move this stage onto ${target} and pass the organization facts in through the request payload — "tenant: authored" exempts only entry stages and $graphLookup, not $lookup sub-pipelines.`;
  }
  return `Run the pipeline on ${target} and pass the organization facts in through the request payload, or declare tenant: authored on this request and author the organization clause yourself.`;
}

// The wall never prepends a $match into a $graphLookup - it audits the
// restrictSearchWithMatch clause the author wrote. Same empty result, a
// different mechanism, so the message must not send an author looking for an
// injected $match that does not exist.
function emptyJoinMechanism({ stageKey, collection }) {
  if (stageKey === '$graphLookup') {
    return `The wall audits the "restrictSearchWithMatch" clause you author on it against the caller's organization, and that clause filters on a field collection "${collection}" does not carry, so the traversal returns nothing.`;
  }
  return 'The wall prepends a tenant $match into every $lookup/$unionWith sub-pipeline, so this stage will match nothing and the join returns [].';
}

function validateTenantPipeline({
  config,
  location,
  tenantConnections,
  tenantCollectionMap,
  collections,
  configKey,
}) {
  const errors = [];
  if (config.tenant === 'none') {
    return errors;
  }
  if (!tenantConnections || !tenantConnections.has(config.connectionId)) {
    return errors;
  }
  const pipeline = config.properties?.pipeline;
  if (!type.isArray(pipeline)) {
    return errors;
  }
  const authored = config.tenant === 'authored';

  function addError(message) {
    errors.push(new ConfigError(message, { configKey, checkSlug: 'tenant-lookup' }));
  }

  function checkSharedCollection({ collection, stageKey }) {
    const declared = collections?.[collection];
    if (!type.isUndefined(declared?.tenant)) {
      if (declared.tenant !== 'shared') return;
      const sharedConnectionId = declared.connections.find(
        (joined) => joined.tenant === 'shared'
      )?.connectionId;
      const owner = type.isUndefined(sharedConnectionId)
        ? 'is declared tenant: shared in collections:'
        : `is declared tenant: shared in collections: and belongs to connection "${sharedConnectionId}"`;
      addError(
        `${location} uses "${stageKey}" on collection "${collection}" over tenant connection "${
          config.connectionId
        }". Collection "${collection}" ${owner}, so it carries no tenant field. ${emptyJoinMechanism(
          { stageKey, collection }
        )} ${fixMessage({ config, sharedConnectionId })}`
      );
      return;
    }
    const shared = tenantCollectionMap?.[collection]?.shared ?? [];
    if (shared.length === 0) return;
    const [sharedConnectionId, ...rest] = shared;
    const also = rest.length > 0 ? ` (also declared on: ${rest.join(', ')})` : '';
    addError(
      `${location} uses "${stageKey}" on collection "${collection}" over tenant connection "${
        config.connectionId
      }". Collection "${collection}" belongs to connection "${sharedConnectionId}"${also}, which is declared tenant: shared, so it carries no tenant field. ${emptyJoinMechanism(
        { stageKey, collection }
      )} ${fixMessage({ config, sharedConnectionId })}`
    );
  }

  function addUnscopableStageError({ stageKey, at }) {
    addError(
      `${location} contains "${stageKey}" in ${at} on tenant connection "${config.connectionId}", which the tenant wall does not scope mechanically. Author the organization clause inside the stage (for $search/$searchMeta: an equals clause on the tenant field in "compound.filter"; for $vectorSearch/$geoNear: a tenant-field equality in "filter"/"query"; for $graphLookup: a tenant-field equality in "restrictSearchWithMatch"), then declare tenant: authored on it to confirm it owns its organization scoping. The clause is audited against the caller's organization at runtime.`
    );
  }

  function walkStage(stage, at) {
    if (!type.isObject(stage)) return;
    const refused = Object.keys(REFUSED_STAGES).find((key) => stage[key] !== undefined);
    if (refused) {
      addError(
        `${location} contains "${refused}" in ${at} on tenant connection "${config.connectionId}". ${REFUSED_STAGES[refused]}, so the request is refused at runtime. Move the stage onto a connection outside the tenant wall.`
      );
    }
    if (type.isObject(stage.$lookup)) {
      if (type.isString(stage.$lookup.from)) {
        checkSharedCollection({ collection: stage.$lookup.from, stageKey: '$lookup' });
      }
      walkPipeline(stage.$lookup.pipeline, 'a "$lookup" sub-pipeline');
    }
    if (type.isString(stage.$unionWith)) {
      checkSharedCollection({ collection: stage.$unionWith, stageKey: '$unionWith' });
    }
    if (type.isObject(stage.$unionWith)) {
      if (type.isString(stage.$unionWith.coll)) {
        checkSharedCollection({ collection: stage.$unionWith.coll, stageKey: '$unionWith' });
      }
      walkPipeline(stage.$unionWith.pipeline, 'a "$unionWith" sub-pipeline');
    }
    if (type.isObject(stage.$graphLookup)) {
      if (!authored) {
        addUnscopableStageError({ stageKey: '$graphLookup', at });
      }
      if (type.isString(stage.$graphLookup.from)) {
        checkSharedCollection({ collection: stage.$graphLookup.from, stageKey: '$graphLookup' });
      }
    }
    if (type.isObject(stage.$facet)) {
      // A $facet branch is not a pipeline entry - the wall injects nothing at
      // its head - so its stages are walked without the entry-stage check.
      Object.entries(stage.$facet).forEach(([key, branch]) => {
        if (!type.isArray(branch)) return;
        branch.forEach((branchStage) => walkStage(branchStage, `${at} ($facet branch "${key}")`));
      });
    }
  }

  function walkPipeline(stages, at) {
    if (!type.isArray(stages)) return;
    const first = stages[0];
    const entryStage =
      type.isObject(first) && AUTHORED_ENTRY_STAGES.find((key) => first[key] !== undefined);
    if (entryStage && !authored) {
      addUnscopableStageError({ stageKey: entryStage, at });
    }
    stages.forEach((stage) => walkStage(stage, at));
  }

  walkPipeline(pipeline, 'its pipeline');
  return errors;
}

export default validateTenantPipeline;
