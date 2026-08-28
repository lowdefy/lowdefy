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

import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';

// Circular import by design: the walker dispatches placeholders into
// resolveDeferred, and resolveDeferred walks record bodies. Both modules only
// reference each other's bindings at call time, after evaluation completes.
import { loadAndWalkRef, resolve, WalkContext } from './walker.js';
import cloneWithMarkers from './cloneWithMarkers.js';

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

// Wait-graph reachability: is `targetId` reachable from `fromId` through
// waitingOn edges? A synchronous set walk — edges only change between awaits,
// so check-then-insert is atomic.
function findPathTo(context, fromId, targetId, path = []) {
  if (fromId === targetId) return [...path, fromId];
  if (path.includes(fromId)) return null;
  const record = context.deferred[fromId];
  if (!record) return null;
  for (const nextId of record.waitingOn) {
    const found = findPathTo(context, nextId, targetId, [...path, fromId]);
    if (found) return found;
  }
  return null;
}

// Demand-driven resolution for single-value record kinds (entryRef,
// varDefault), promise-memoized per record. Cycle detection is a wait-graph —
// standard deadlock detection: when resolution of record R demands record S,
// add edge R → S; if S is in flight and R is reachable from S, the demand
// closes a cycle in "who is awaiting whom" and awaiting would deadlock — throw
// the named chain instead. Demands from outside any record
// (ctx.activeRecord = null) add no edges: they can wait on anything.
//
// The returned value is the memoized instance — callers that splice it into
// mutable config must clone (the walker's placeholder dispatch does).
// A rejected promise stays memoized: a record whose resolution throws is
// genuinely broken, and every demander should see the same error once.
async function resolveDeferred(ctx, id) {
  const context = ctx.buildContext;
  const record = getRecord(context, id);
  if (record.kind === 'component' || record.kind === 'menuLinks') {
    throw new LowdefyInternalError(
      `Deferred record "${id}" of kind "${record.kind}" resolves per consumer — ` +
        `it cannot be demanded through resolveDeferred.`
    );
  }
  if (record.done) return record.value;

  const demanderId = ctx.activeRecord;
  const demander = demanderId ? context.deferred[demanderId] : null;

  if (record.promise && demander) {
    // In flight: if the demander is reachable from this record, awaiting would
    // deadlock — the actual dependency cycle, named record by record.
    const path = findPathTo(context, id, demanderId);
    if (path) {
      throw new ConfigError(
        `Circular deferred value dependency: ${[demanderId, ...path].join(' → ')}.`,
        { filePath: record.env?.file ?? null }
      );
    }
  }

  if (demander) {
    demander.waitingOn.add(id);
  }
  try {
    if (!record.promise) {
      // Defer the body walk by a microtask so the memo is assigned before any
      // synchronous prefix of the walk can re-enter this record — otherwise a
      // self-cycle recurses on a still-null promise instead of hitting the
      // wait-graph check.
      record.promise = Promise.resolve().then(() => resolveRecordBody(ctx, id, record));
    }
    return await record.promise;
  } finally {
    if (demander) {
      demander.waitingOn.delete(id);
    }
  }
}

// Walk a record's body under a fresh context built from record.env — no
// reconstruction from in-tree markers. Operators and identifier tables come
// from the demanding context (they are build-wide singletons); the resolution
// environment (file, roots, module entry) comes from the record.
async function resolveRecordBody(ctx, id, record) {
  const context = ctx.buildContext;
  const env = record.env ?? {};
  const moduleEntry = env.entryId ? (context.modules[env.entryId] ?? null) : null;
  const recordCtx = new WalkContext({
    buildContext: context,
    refId: env.refId ?? null,
    sourceRefId: null,
    vars: {},
    moduleDependencies: moduleEntry?.moduleDependencies,
    moduleEntry,
    moduleRoot: env.moduleRoot ?? null,
    packageRoot: env.packageRoot ?? null,
    path: '',
    currentFile: env.file ?? null,
    refChain: new Set(env.file ? [env.file] : []),
    operators: ctx.operators,
    env: ctx.env,
    lowdefyApp: ctx.lowdefyApp,
    dynamicIdentifiers: ctx.dynamicIdentifiers,
    // A record demanded before the auth-config projection exists (the entry
    // sweep) memoizes its value, and that value is re-walked wherever it is
    // consumed — so _build.authConfig folds defer instead of erroring. Once
    // the projection exists the guard never fires and folds run here.
    deferAuthConfig: true,
    activeRecord: id,
  });
  let value;
  if (record.kind === 'entryRef') {
    // The body is a prepared refDef — replay it through loadAndWalkRef with
    // the original provenance (env.file is where the ref was written).
    value = await loadAndWalkRef(record.body, recordCtx, {
      configKey: env.configKey ?? undefined,
      referencedFrom: env.file ?? undefined,
    });
  } else {
    // varDefault and connRemap bodies are raw config subtrees. Clone before
    // walking — the raw body must stay pristine in the registry
    // (deferredRecords.json serializes it, and demand order must not change it).
    value = await resolve(cloneWithMarkers(record.body), recordCtx);
  }
  record.value = value;
  record.done = true;
  return value;
}


// Placeholder lifetime differs by record kind: component and menuLinks
// placeholders persist by design (per-consumer resolution; JIT consumes them
// from modules.json), and varDefault placeholders persist in varDefs
// (demand-only). Everywhere else a placeholder after the final sweep is a
// build bug. The allowed positions, per module entry:
const MANIFEST_PLACEHOLDER_PATHS = [
  /^components\.\d+\.component$/,
  /^menus\.\d+\.links$/,
  // varDefs is extracted from manifest.vars by reference, so demand-only
  // default placeholders legitimately show through the manifest too.
  /^vars(\.[^.]+\.properties)*\.[^.]+\.default$/,
];
const VARDEFS_PLACEHOLDER_PATHS = [/^[^.]+(\.properties\.[^.]+)*\.default$/];

function findPlaceholderLeaks(context) {
  const leaks = [];
  const scan = (value, path, allowed, location) => {
    const id = getPlaceholderId(value);
    if (id !== undefined) {
      if (!allowed.some((pattern) => pattern.test(path))) {
        leaks.push({ id, location: `${location}.${path}` });
      }
      return;
    }
    if (type.isArray(value)) {
      value.forEach((item, i) => scan(item, path ? `${path}.${i}` : String(i), allowed, location));
    } else if (type.isObject(value)) {
      for (const key of Object.keys(value)) {
        scan(value[key], path ? `${path}.${key}` : key, allowed, location);
      }
    }
  };
  for (const [entryId, entry] of Object.entries(context.modules ?? {})) {
    scan(entry.manifest ?? {}, '', MANIFEST_PLACEHOLDER_PATHS, `${entryId}.manifest`);
    scan(entry.consumerVars ?? {}, '', [], `${entryId}.consumerVars`);
    scan(entry.connections ?? {}, '', [], `${entryId}.connections`);
    scan(entry.varDefs ?? {}, '', VARDEFS_PLACEHOLDER_PATHS, `${entryId}.varDefs`);
  }
  return leaks;
}

// Post-sweep leak check: every entryRef/connRemap placeholder must be gone from
// entry configs, and manifests may hold placeholders only at per-consumer
// slots. The runtime var cache is not scanned — the deep-forcing read path
// guarantees it placeholder-free (pinned by its own tests).
function assertNoPlaceholderLeaks(context) {
  const leaks = findPlaceholderLeaks(context);
  if (leaks.length > 0) {
    const detail = leaks.map((leak) => `"${leak.id}" at ${leak.location}`).join('; ');
    throw new LowdefyInternalError(
      `Deferred placeholder leaked past the final sweep: ${detail}.`
    );
  }
}

// Serialize the registry's data for the deferredRecords.json build artifact.
// Runtime state (promise, waitingOn, done, value) is stripped — JIT re-derives
// it empty. Must go through the marker-preserving serializer: record bodies
// carry non-enumerable ~r/~l/~k markers that plain JSON.stringify would drop,
// breaking error line-number pairing in JIT.
function serializeRegistry(context) {
  const data = {};
  for (const [id, record] of Object.entries(context.deferred ?? {})) {
    data[id] = { kind: record.kind, body: record.body, env: record.env, slot: record.slot };
  }
  return serializer.serializeToString(data);
}

// Hydrate the registry from deserialized deferredRecords.json data (the caller
// deserializes with the marker-restoring reviver, e.g. serializer.deserialize).
function hydrateDeferredRecords(context, data) {
  context.deferred = {};
  for (const [id, record] of Object.entries(data ?? {})) {
    context.deferred[id] = {
      kind: record.kind,
      body: record.body,
      env: record.env,
      slot: record.slot ?? null,
      promise: null,
      waitingOn: new Set(),
      done: false,
      value: undefined,
    };
  }
}

export {
  DEFERRED_KEY,
  makeRecordId,
  createRecord,
  getRecord,
  makePlaceholder,
  getPlaceholderId,
  resolveDeferred,
  assertNoPlaceholderLeaks,
  serializeRegistry,
  hydrateDeferredRecords,
};
