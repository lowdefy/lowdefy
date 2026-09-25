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

// The write half of the tenant: none opt-out (the guard is computed by the
// api's resolveTenantGuard). An unscoped request is neither filtered nor
// stamped, so the app authors the tenant field itself - and this checks that
// it did. Every row an unscoped write leaves behind must carry a non-empty
// string organization id: a row with a null or missing field is invisible to
// every walled read, and the tenant preflight refuses to serve the whole app
// once one exists. Refusing the write turns that outage into one failed
// request that names its step.
//
// Only the tenant field is checked, and only what THIS write does to it - the
// filter stays unscoped (tenant: none may address rows of every org).
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
    `Unscoped write (tenant: none) on a tenant connection must leave "${field}" a non-empty organization id on every row it writes - ${detail}. A row without it is invisible to every walled read and makes the tenant preflight refuse to serve the app. Author the organization id explicitly, or keep data that belongs to no organization on a tenant: shared connection.`
  );
}

function isDottedPath({ path, field }) {
  return path.startsWith(`${field}.`);
}

function filterSetsOrganizationId({ filter, field }) {
  const clause = filter?.[field];
  if (isOrganizationId(clause)) return true;
  return (
    typeof clause === 'object' &&
    clause !== null &&
    Object.keys(clause).length === 1 &&
    isOrganizationId(clause.$eq)
  );
}

function initialState({ filter, field, upsert }) {
  if (!upsert) return 'kept';
  return filterSetsOrganizationId({ filter, field }) ? 'set' : 'missing';
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
  const inclusion = Object.entries(projection).some(
    ([path, value]) => path !== '_id' && value !== 0 && value !== false
  );
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

function assertUnscopedUpdate({ update, filter, field, upsert = false, position = 'an update' }) {
  const state = initialState({ filter, field, upsert });
  const end = Array.isArray(update)
    ? pipelineUpdateState({ update, field, state })
    : objectUpdateState({ update, field, state });
  assertEndState({ state: end, field, position });
}

function assertUnscopedBulkOperations({ operations, field }) {
  (operations ?? []).forEach((operation, index) => {
    const [kind, op] = Object.entries(operation ?? {})[0] ?? [];
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

export { assertUnscopedBulkOperations, assertUnscopedDoc, assertUnscopedUpdate };
