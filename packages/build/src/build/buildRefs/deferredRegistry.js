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

import { LowdefyInternalError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The deferred-content record registry. Every deferred region of module config
// becomes a record { kind, body, env, slot } in context.deferred; the config
// tree holds only an enumerable placeholder { '~deferred': '<id>' }. Records
// carry the resolution environment explicitly instead of reconstructing it
// from in-tree markers — the placeholder is plain data that survives every
// clone, serializer.copy, and JSON round-trip to JIT.
//
// Record kinds:
// - 'component' / 'menuLinks': resolved per consumer (per-ref vars differ) —
//   no promise memo, no write-back; placeholders persist in manifests.
// - 'varDefault' / 'entryRef': single-value, resolved on demand and
//   promise-memoized per record (resolveDeferred; lands with the wait-graph).
//
// Resolution state (promise, waitingOn, done, value) is runtime-only and never
// serialized; JIT re-derives it empty.

const DEFERRED_KEY = '~deferred';

// Record ids derive from the creation site's stable coordinates, never a
// counter — the walker resolves siblings with Promise.all, so creation order
// is nondeterministic, and ids leak into build artifacts.
function makeRecordId({ entryId, configPath }) {
  return `${entryId ?? 'app'}:${configPath}`;
}

function createRecord(context, { id, kind, body, env, slot = null }) {
  context.deferred ??= {};
  if (Object.hasOwn(context.deferred, id)) {
    throw new LowdefyInternalError(
      `Deferred record "${id}" already exists — one record per config position per build.`
    );
  }
  const record = {
    kind,
    body,
    env,
    slot,
    promise: null,
    waitingOn: new Set(),
    done: false,
    value: undefined,
  };
  context.deferred[id] = record;
  return record;
}

function getRecord(context, id) {
  const record = context.deferred?.[id];
  if (!record) {
    throw new LowdefyInternalError(`Deferred record "${id}" not found in the registry.`);
  }
  return record;
}

function makePlaceholder(id) {
  return { [DEFERRED_KEY]: id };
}

// A placeholder is exactly a one-enumerable-key object { '~deferred': '<id>' }.
// The key is reserved (parseRefContent rejects it in source content), so any
// such object in the tree was created by the build.
function getPlaceholderId(node) {
  if (!type.isObject(node)) return undefined;
  const keys = Object.keys(node);
  if (keys.length !== 1 || keys[0] !== DEFERRED_KEY) return undefined;
  const id = node[DEFERRED_KEY];
  return type.isString(id) ? id : undefined;
}

export { DEFERRED_KEY, makeRecordId, createRecord, getRecord, makePlaceholder, getPlaceholderId };
