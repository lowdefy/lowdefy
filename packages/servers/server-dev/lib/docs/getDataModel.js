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

import fs from 'node:fs';
import path from 'node:path';
import { resolveConfigLocation } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import readBuildArtifact from './readBuildArtifact.js';
import resolveCollectionJoin from './resolveCollectionJoin.js';

// Every reader/writer entry carries the same keys in the same order so the
// consumers that read these joins (write validation, migrations) can rely on
// the shape; optional identifiers are only present for the entry's kind.
function createEntry({ kind, ids, type: requestType, connectionId, via, source }) {
  return { kind, ...ids, type: requestType, connectionId, via, source };
}

function createResolveSource() {
  const keyMap = readBuildArtifact({ name: 'keyMap.json' }) ?? {};
  const refMap = readBuildArtifact({ name: 'refMap.json' }) ?? {};
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  // The same file:line shape build errors carry, relative to the config
  // directory so the response stays portable and short to read.
  return function resolveSource(configKey) {
    const location = resolveConfigLocation({ configKey, keyMap, refMap, configDirectory });
    if (type.isNone(location)) {
      return null;
    }
    return path.relative(configDirectory, location.source);
  };
}

// The framework's own read/write classification, written per request type by
// packages/build/src/build/writePluginImports/writeConnectionSchemaMap.js. A
// hardcoded list of MongoDB type names would go stale the moment a request
// type is added, so meta is the only source.
function classifyRequestType({ requestType, requestSchemas }) {
  const meta = requestSchemas[requestType]?.meta;
  if (type.isNone(meta)) {
    return null;
  }
  if (meta.checkWrite === true) {
    return 'write';
  }
  if (meta.checkRead === true) {
    return 'read';
  }
  return null;
}

function createCollection({ name, declaration }) {
  const declared = !type.isNone(declaration);
  return {
    declared,
    tenant: declared ? declaration.tenant ?? null : null,
    fields: declared ? declaration.fields ?? {} : {},
    // The JSON Schema array form, so { type: object, properties: fields,
    // required } is a schema an agent can compile as it stands.
    required: declared ? declaration.required ?? [] : [],
    relations: declared ? declaration.relations ?? {} : {},
    indexes: declared ? declaration.indexes ?? [] : [],
    connections: [],
    readers: [],
    writers: [],
    // Build-only: whether the declaration carried a tenant. Deleted before
    // the model is returned.
    declaredTenant: declared && !type.isUndefined(declaration.tenant),
    name,
  };
}

function getCollection({ collections, name }) {
  if (type.isUndefined(collections[name])) {
    collections[name] = createCollection({ name, declaration: null });
  }
  return collections[name];
}

// Literal pipelines only — an operator-valued pipeline can not be read at
// build. Sub-pipelines ($lookup, $unionWith, $facet branches) are scanned
// too, since a nested $lookup reads just as much as a top-level one.
function scanPipeline({ pipeline, onRead, onWrite, onUnresolved }) {
  if (!type.isArray(pipeline)) {
    return;
  }
  pipeline.forEach((stage) => {
    if (!type.isObject(stage)) {
      return;
    }
    if (!type.isUndefined(stage.$lookup)) {
      scanNamedCollection({
        value: stage.$lookup?.from,
        stageName: '$lookup.from',
        onFound: onRead,
        onUnresolved,
      });
      scanPipeline({ pipeline: stage.$lookup?.pipeline, onRead, onWrite, onUnresolved });
    }
    if (!type.isUndefined(stage.$graphLookup)) {
      scanNamedCollection({
        value: stage.$graphLookup?.from,
        stageName: '$graphLookup.from',
        onFound: onRead,
        onUnresolved,
      });
    }
    if (!type.isUndefined(stage.$unionWith)) {
      const unionWith = stage.$unionWith;
      scanNamedCollection({
        value: type.isString(unionWith) ? unionWith : unionWith?.coll,
        stageName: '$unionWith',
        onFound: onRead,
        onUnresolved,
      });
      scanPipeline({ pipeline: unionWith?.pipeline, onRead, onWrite, onUnresolved });
    }
    if (type.isObject(stage.$facet)) {
      Object.values(stage.$facet).forEach((branch) => {
        scanPipeline({ pipeline: branch, onRead, onWrite, onUnresolved });
      });
    }
    if (!type.isUndefined(stage.$merge)) {
      const merge = stage.$merge;
      const into = type.isString(merge) ? merge : merge?.into;
      scanNamedCollection({
        value: type.isObject(into) ? into.coll : into,
        stageName: '$merge.into',
        onFound: onWrite,
        onUnresolved,
      });
    }
    if (!type.isUndefined(stage.$out)) {
      const out = stage.$out;
      scanNamedCollection({
        value: type.isObject(out) ? out.coll : out,
        stageName: '$out',
        onFound: onWrite,
        onUnresolved,
      });
    }
  });
}

function scanNamedCollection({ value, stageName, onFound, onUnresolved }) {
  if (type.isString(value)) {
    onFound(value);
    return;
  }
  onUnresolved(`${stageName} is not a literal collection name`);
}

function describeEntry({ kind, ids }) {
  if (kind === 'request') {
    return `request "${ids.requestId}" on page "${ids.pageId}"`;
  }
  if (kind === 'step') {
    return `step "${ids.stepId}" on endpoint "${ids.endpointId}"`;
  }
  return `websocket "${ids.websocketId}"`;
}

// One request-like thing (page request, routine step, websocket) becomes
// reader/writer edges on collections, or an unresolved entry naming why the
// join could not be made. Nothing is ever dropped silently — a missing edge
// reads as "nothing writes this collection".
function addEdges({
  kind,
  ids,
  requestType,
  connectionId,
  configKey,
  properties,
  classification,
  context,
}) {
  const { collections, join, unresolved, resolveSource } = context;
  const source = resolveSource(configKey);
  const label = describeEntry({ kind, ids });

  function pushUnresolved(reason) {
    unresolved.push({
      kind,
      ...ids,
      type: requestType,
      connectionId: connectionId ?? null,
      reason,
    });
  }

  if (type.isNone(connectionId)) {
    pushUnresolved(`${label} has no connectionId`);
    return;
  }
  const connection = join.connections[connectionId];
  if (type.isUndefined(connection)) {
    pushUnresolved(`connection "${connectionId}" was not found`);
    return;
  }
  if (type.isNone(connection.collection)) {
    if (join.dynamicConnectionIds.has(connectionId)) {
      pushUnresolved(
        `${label} uses connection "${connectionId}", which has an operator-valued "collection" property`
      );
    }
    // A connection that names no collection at all (HTTP, SMTP, an AI
    // provider) is not part of the data model.
    return;
  }
  if (type.isNone(classification)) {
    pushUnresolved(
      `request type "${requestType}" declares neither checkRead nor checkWrite in its meta, so it can not be classified`
    );
    return;
  }

  function addEdge({ collectionName, direction, via }) {
    const collection = getCollection({ collections, name: collectionName });
    const list = direction === 'write' ? collection.writers : collection.readers;
    list.push(createEntry({ kind, ids, type: requestType, connectionId, via, source }));
  }

  addEdge({ collectionName: connection.collection, direction: classification, via: kind });

  // An aggregation is checkRead: true, checkWrite: false — without this scan
  // a $merge writer would be reported as a reader.
  scanPipeline({
    pipeline: properties?.pipeline,
    onRead: (collectionName) => addEdge({ collectionName, direction: 'read', via: '$lookup' }),
    onWrite: (collectionName) => addEdge({ collectionName, direction: 'write', via: '$merge' }),
    onUnresolved: (reason) => pushUnresolved(`${label} pipeline stage ${reason}`),
  });
}

function collectPageRequests({ context }) {
  const registry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  Object.keys(registry).forEach((pageId) => {
    const page = readBuildArtifact({ name: `pages/${pageId}.json`, deserialize: true });
    if (type.isNone(page)) {
      // Pages are JIT-built on first visit in dev; an unbuilt page has no
      // request artifacts to read yet.
      context.unbuiltPageIds.push(pageId);
      return;
    }
    (page.requests ?? []).forEach((pageRequest) => {
      const requestId = pageRequest.requestId;
      const request = readBuildArtifact({
        name: `pages/${pageId}/requests/${requestId}.json`,
        deserialize: true,
      });
      if (type.isNone(request)) {
        context.unresolved.push({
          kind: 'request',
          pageId,
          requestId,
          reason: `request "${requestId}" on page "${pageId}" has no build artifact`,
        });
        return;
      }
      addEdges({
        kind: 'request',
        ids: { pageId, requestId },
        requestType: request.type ?? null,
        connectionId: request.connectionId,
        configKey: request['~k'],
        properties: request.properties,
        classification: classifyRequestType({
          requestType: request.type,
          requestSchemas: context.requestSchemas,
        }),
        context,
      });
    });
  });
}

// Routines nest (:if/:then/:else, :try/:catch, :for/:do, :switch, :parallel),
// so every array and object is walked; a request step is recognised by its
// build-stamped stepId beside a request type or a connectionId
// (packages/build/src/build/buildApi/buildRoutine/validateStep.js). Control
// steps and CallApi/CallAgent steps carry no connectionId and are not request
// types, so they are walked through, not reported.
function walkRoutine({ routine, endpointId, context }) {
  if (type.isArray(routine)) {
    routine.forEach((item) => walkRoutine({ routine: item, endpointId, context }));
    return;
  }
  if (!type.isObject(routine)) {
    return;
  }
  const isRequestStep =
    type.isString(routine.stepId) &&
    type.isString(routine.type) &&
    (!type.isNone(routine.connectionId) || !type.isUndefined(context.requestSchemas[routine.type]));
  if (isRequestStep) {
    addEdges({
      kind: 'step',
      ids: { endpointId, stepId: routine.stepId },
      requestType: routine.type,
      connectionId: routine.connectionId,
      configKey: routine['~k'],
      properties: routine.properties,
      classification: classifyRequestType({
        requestType: routine.type,
        requestSchemas: context.requestSchemas,
      }),
      context,
    });
    return;
  }
  Object.keys(routine).forEach((key) => {
    if (key.startsWith('~')) {
      return;
    }
    walkRoutine({ routine: routine[key], endpointId, context });
  });
}

// api/ has one artifact per endpoint and no id manifest, so the ids come from
// a directory listing (as in getAppMap.js).
function collectRoutineSteps({ context }) {
  const apiDirectory = path.join(process.cwd(), 'build', 'api');
  if (!fs.existsSync(apiDirectory)) {
    return;
  }
  fs.readdirSync(apiDirectory)
    .filter((filename) => filename.endsWith('.json'))
    .forEach((filename) => {
      const endpointId = filename.slice(0, -'.json'.length);
      const endpoint = readBuildArtifact({ name: `api/${endpointId}.json`, deserialize: true });
      walkRoutine({ routine: endpoint?.routine, endpointId, context });
    });
}

// A websocket is a subscription — it only ever reads its connection's
// collection (a change stream). Websocket types without a connection
// (Channel) address no data and are not part of the model.
function collectWebsockets({ context }) {
  const websocketIds = readBuildArtifact({ name: 'websocketIds.json' }) ?? [];
  websocketIds.forEach((websocketId) => {
    const websocket = readBuildArtifact({
      name: `websockets/${websocketId}.json`,
      deserialize: true,
    });
    if (type.isNone(websocket) || type.isNone(websocket.connectionId)) {
      return;
    }
    addEdges({
      kind: 'websocket',
      ids: { websocketId },
      requestType: websocket.type ?? null,
      connectionId: websocket.connectionId,
      configKey: websocket['~k'],
      properties: websocket.properties,
      classification: 'read',
      context,
    });
  });
}

function sameTenant(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// The tenant verdict an agent needs before writing a query: the declaration
// when there is one, otherwise what the connections agree on, otherwise the
// disagreement spelled out — never a silent pick.
function resolveCollectionTenant(collection) {
  if (collection.declaredTenant) {
    return collection.tenant;
  }
  if (collection.connections.length === 0) {
    return null;
  }
  const first = collection.connections[0].tenant;
  const agree = collection.connections.every((connection) => sameTenant(connection.tenant, first));
  if (agree) {
    return first;
  }
  return {
    conflict: collection.connections.map((connection) => ({
      connectionId: connection.connectionId,
      tenant: connection.tenant,
    })),
  };
}

// The app's data layer in one call: every collection (declared in
// lowdefy.yaml `collections:` or discovered from a connection or a literal
// pipeline), its fields/relations/indexes/tenant, the connections addressing
// it, and every page request, routine step and websocket that reads or
// writes it, each with a resolved source location. Offline — build
// artifacts only, no database introspection.
function getDataModel() {
  const declared = readBuildArtifact({ name: 'collections.json' }) ?? {};
  const requestSchemas = readBuildArtifact({ name: 'plugins/requestSchemas.json' }) ?? {};
  const join = resolveCollectionJoin();
  join.dynamicConnectionIds = new Set(join.unresolved.map((entry) => entry.connectionId));

  const collections = {};
  Object.keys(declared).forEach((name) => {
    collections[name] = createCollection({ name, declaration: declared[name] });
  });

  Object.values(join.connections).forEach((connection) => {
    if (type.isNone(connection.collection)) {
      return;
    }
    getCollection({ collections, name: connection.collection }).connections.push({
      connectionId: connection.connectionId,
      type: connection.type,
      read: connection.read,
      write: connection.write,
      tenant: connection.tenant,
    });
  });

  const context = {
    collections,
    join,
    requestSchemas,
    resolveSource: createResolveSource(),
    unresolved: join.unresolved.map((entry) => ({
      kind: 'connection',
      connectionId: entry.connectionId,
      reason: entry.reason,
    })),
    unbuiltPageIds: [],
  };

  collectPageRequests({ context });
  collectRoutineSteps({ context });
  collectWebsockets({ context });

  Object.values(collections).forEach((collection) => {
    collection.tenant = resolveCollectionTenant(collection);
    delete collection.declaredTenant;
    delete collection.name;
  });

  const model = { collections, unresolved: context.unresolved };

  // Pages are JIT-built on first visit in dev, so an unbuilt page's requests
  // are not readable yet — named rather than silently missing, since a
  // missing edge reads as "nothing writes this collection".
  if (context.unbuiltPageIds.length > 0) {
    model.unbuiltPages = context.unbuiltPageIds;
  }

  if (Object.keys(declared).length === 0) {
    model.note =
      'No collections: declared in lowdefy.yaml — fields and relations are empty. ' +
      'See /lowdefy-docs/content/concepts/collections.';
  }

  return model;
}

export default getDataModel;
