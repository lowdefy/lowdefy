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

import getCollectionWriteStage from './getCollectionWriteStage.js';

// The write guard of a tenant: shared connection over a walled collection (the
// guard is computed by the api's resolveTenancy). An unscoped write is neither
// filtered nor stamped, so the app authors the tenant field itself - and this
// checks that it did. Every row an unscoped write leaves behind must carry a
// non-empty string organization id: a row with a null or missing field is
// invisible to every walled read. Refusing the write fails one request that
// names its step instead of leaving a row nobody can see.
//
// Only the tenant field is checked, and only what THIS write does to it - the
// filter stays unscoped (a shared connection may address rows of every org).
//
// Updates are walked as a small state machine over the field:
//   kept    - the matched row keeps whatever it holds (not this write's doing)
//   set     - the write authors a verified organization id
//   missing - an upserted row would be born without it
//   dropped - the write removes it
//   unknown - an expression the guard can not evaluate writes it
// A write passes only if it ends kept or set. A later stage can repair an
// earlier one (a trailing { $set: { organization_id: 'org' } } after a
// $replaceWith), which is also the advice the error gives.

function isOrganizationId(value) {
  return typeof value === 'string' && value !== '';
}

// In a pipeline stage a string starting with $ is a field path or variable,
// not a literal - it can not be verified. { $literal: 'org' } can.
function isPipelineOrganizationId(value) {
  if (typeof value === 'object' && value !== null && Object.keys(value).length === 1) {
    if (Object.prototype.hasOwnProperty.call(value, '$literal')) {
      return isOrganizationId(value.$literal);
    }
  }
  return isOrganizationId(value) && !value.startsWith('$');
}

function refuse({ field, detail }) {
  throw new ConfigError(
    `Unscoped write to a walled collection (a tenant: shared connection over a collection a scoped connection reads) must leave "${field}" a non-empty organization id on every row it writes - ${detail}. A row without it is invisible to every walled read and stays invisible until it is fixed. Author the organization id explicitly, or keep data that belongs to no organization in a collection no scoped connection reads.`
  );
}

function isDottedPath({ path, field }) {
  return path.startsWith(`${field}.`);
}

// The organization id a filter pins the tenant field to by equality
// ({ field: 'org' } or { field: { $eq: 'org' } }), or null.
function filterOrganizationId({ filter, field }) {
  const clause = filter?.[field];
  if (isOrganizationId(clause)) return clause;
  if (
    typeof clause === 'object' &&
    clause !== null &&
    Object.keys(clause).length === 1 &&
    isOrganizationId(clause.$eq)
  ) {
    return clause.$eq;
  }
  return null;
}

function initialState({ filter, field, upsert }) {
  if (!upsert) return 'kept';
  return filterOrganizationId({ filter, field }) === null ? 'missing' : 'set';
}

function assertEndState({ state, field, position }) {
  if (state === 'kept' || state === 'set') return;
  const reasons = {
    missing: `${position} can upsert a row without it (author it in $set or $setOnInsert, or match it by equality in the filter)`,
    dropped: `${position} removes it`,
    unknown: `${position} writes it from an expression the wall can not verify (end with { $set: { ${field}: <organization id> } })`,
  };
  refuse({ field, detail: reasons[state] });
}

function assertUnscopedDoc({ doc, field, position = 'an insert document' }) {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    refuse({ field, detail: `${position} is not a document` });
  }
  Object.keys(doc).forEach((path) => {
    if (isDottedPath({ path, field })) {
      refuse({ field, detail: `${position} writes into it with the dotted path "${path}"` });
    }
  });
  if (!isOrganizationId(doc[field])) {
    refuse({
      field,
      detail: `${position} carries ${JSON.stringify(doc[field] ?? null)}`,
    });
  }
}

// Object form: { $set: {...}, $unset: {...}, ... }.
function objectUpdateState({ update, field, state }) {
  let next = state;
  Object.entries(update ?? {}).forEach(([operator, argument]) => {
    if (argument === null || typeof argument !== 'object') return;
    if (operator === '$rename') {
      Object.entries(argument).forEach(([source, target]) => {
        if (source === field || isDottedPath({ path: source, field })) {
          next = 'dropped';
        }
        if (
          typeof target === 'string' &&
          (target === field || isDottedPath({ path: target, field }))
        ) {
          next = 'unknown';
        }
      });
      return;
    }
    Object.entries(argument).forEach(([path, value]) => {
      if (isDottedPath({ path, field })) {
        refuse({ field, detail: `an update writes into it with the dotted path "${path}"` });
      }
      if (path !== field) return;
      if (operator === '$set' || operator === '$setOnInsert') {
        if (!isOrganizationId(value)) {
          refuse({ field, detail: `an update ${operator}s it to ${JSON.stringify(value)}` });
        }
        next = 'set';
        return;
      }
      if (operator === '$unset') {
        next = 'dropped';
        return;
      }
      refuse({ field, detail: `an update applies ${operator} to it` });
    });
  });
  return next;
}

function projectState({ projection, field, state }) {
  if (projection === null || typeof projection !== 'object') return 'unknown';
  if (Object.prototype.hasOwnProperty.call(projection, field)) {
    const value = projection[field];
    if (value === 1 || value === true) return state;
    if (value === 0 || value === false) return 'dropped';
    return isPipelineOrganizationId(value) ? 'set' : 'unknown';
  }
  // _id may be included or excluded in either mode, so it decides the mode
  // only when it is the one path: { _id: 1 } keeps _id and nothing else.
  const paths = Object.keys(projection).filter((path) => path !== '_id');
  const inclusion =
    paths.length > 0
      ? paths.some((path) => projection[path] !== 0 && projection[path] !== false)
      : Object.prototype.hasOwnProperty.call(projection, '_id') &&
        projection._id !== 0 &&
        projection._id !== false;
  return inclusion ? 'dropped' : state;
}

function newRootState({ newRoot, field }) {
  if (newRoot === null || typeof newRoot !== 'object' || Array.isArray(newRoot)) {
    return 'unknown';
  }
  if (Object.keys(newRoot).some((key) => key.startsWith('$'))) return 'unknown';
  if (!Object.prototype.hasOwnProperty.call(newRoot, field)) return 'dropped';
  return isPipelineOrganizationId(newRoot[field]) ? 'set' : 'unknown';
}

function unsetPaths(argument) {
  return (Array.isArray(argument) ? argument : [argument]).filter(
    (path) => typeof path === 'string'
  );
}

// Pipeline form: [{ $set: {...} }, { $unset: [...] }, ...], stage by stage.
function pipelineUpdateState({ update, field, state }) {
  return update.reduce((current, stage) => {
    if (stage === null || typeof stage !== 'object') return current;
    let next = current;
    Object.entries(stage).forEach(([operator, argument]) => {
      switch (operator) {
        case '$set':
        case '$addFields':
          if (argument === null || typeof argument !== 'object') return;
          Object.keys(argument).forEach((path) => {
            if (isDottedPath({ path, field })) next = 'unknown';
          });
          if (Object.prototype.hasOwnProperty.call(argument, field)) {
            next = isPipelineOrganizationId(argument[field]) ? 'set' : 'unknown';
          }
          return;
        case '$unset':
          if (
            unsetPaths(argument).some((path) => path === field || isDottedPath({ path, field }))
          ) {
            next = 'dropped';
          }
          return;
        case '$project':
          next = projectState({ projection: argument, field, state: next });
          return;
        case '$replaceRoot':
          next = newRootState({ newRoot: argument?.newRoot, field });
          return;
        case '$replaceWith':
          next = newRootState({ newRoot: argument, field });
          return;
        default:
          next = 'unknown';
      }
    });
    return next;
  }, state);
}

function updateEndState({ update, field, state }) {
  return Array.isArray(update)
    ? pipelineUpdateState({ update, field, state })
    : objectUpdateState({ update, field, state });
}

function assertUnscopedUpdate({ update, filter, field, upsert = false, position = 'an update' }) {
  const state = initialState({ filter, field, upsert });
  assertEndState({ state: updateEndState({ update, field, state }), field, position });
}

function assertUnscopedBulkOperations({ operations, field }) {
  (operations ?? []).forEach((operation, index) => {
    const entries = Object.entries(operation ?? {});
    // The driver picks the kind it runs by its own precedence (insertOne
    // first), so an operation naming several kinds could run one this guard
    // never checked.
    if (entries.length !== 1) {
      throw new ConfigError(
        `bulkWrite operation ${index} on a tenant connection must name exactly one operation kind - received ${JSON.stringify(
          entries.map(([kind]) => kind)
        )}.`
      );
    }
    const [kind, op] = entries[0];
    const position = `bulkWrite operation ${index} (${kind})`;
    switch (kind) {
      case 'insertOne':
        assertUnscopedDoc({ doc: op?.document, field, position });
        return;
      case 'replaceOne':
        assertUnscopedDoc({ doc: op?.replacement, field, position });
        return;
      case 'updateOne':
      case 'updateMany':
        assertUnscopedUpdate({
          update: op?.update,
          filter: op?.filter,
          field,
          upsert: op?.upsert === true,
          position,
        });
        return;
      case 'deleteOne':
      case 'deleteMany':
        return;
      default:
        throw new ConfigError(`Unsupported bulkWrite operation "${kind}" on a tenant connection.`);
    }
  });
}

// $out and $merge write the pipeline's output as rows no check can see, so an
// unscoped aggregation can not run them: under tenant: none (readOnly) because
// the opt-out only reads, on a shared connection over a walled collection
// because the rows would skip the guard - refused like on the scoped path
// (injectTenantIntoPipeline). MongoDB only runs them as the final root stage;
// the walk still covers every sub-pipeline the scoped path walks, so the guard
// does not rest on the server's placement rule.
function refusePipelineWrite({ writeStage, field, readOnly }) {
  if (readOnly) {
    throw new ConfigError(
      `An aggregation with tenant: none may only read, and "${writeStage}" writes its output into a collection. Return the documents instead. To write rows of one organization from a system run, call an endpoint with a CallApi step that names the "organization": its requests are filtered and stamped with that organization.`
    );
  }
  throw new ConfigError(
    `Unscoped aggregation on a walled collection (a tenant: shared connection over a collection a scoped connection reads) can not contain "${writeStage}" - it writes rows the tenant guard can not check for a non-empty "${field}", and a row without it stays invisible to every walled read. Return the documents and write them with MongoDBInsertMany or MongoDBBulkWrite, which check every row. An aggregation that neither reads nor writes a walled collection can run on a tenant: shared connection.`
  );
}

function assertUnscopedPipeline({ pipeline, field, readOnly = false }) {
  (Array.isArray(pipeline) ? pipeline : []).forEach((stage) => {
    if (stage === null || typeof stage !== 'object') return;
    const writeStage = getCollectionWriteStage({ stage });
    if (writeStage !== null) {
      refusePipelineWrite({ writeStage, field, readOnly });
    }
    assertUnscopedPipeline({ pipeline: stage.$lookup?.pipeline, field, readOnly });
    assertUnscopedPipeline({ pipeline: stage.$unionWith?.pipeline, field, readOnly });
    if (stage.$facet !== null && typeof stage.$facet === 'object') {
      Object.values(stage.$facet).forEach((branch) =>
        assertUnscopedPipeline({ pipeline: branch, field, readOnly })
      );
    }
  });
}

export {
  assertUnscopedBulkOperations,
  assertUnscopedDoc,
  assertUnscopedPipeline,
  assertUnscopedUpdate,
};
