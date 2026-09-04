/* eslint-disable no-param-reassign */

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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import countOperators from '../utils/countOperators.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import validateId from '../utils/validateId.js';

function validateConnection(connection, context) {
  const configKey = connection?.['~k'];
  if (!type.isObject(connection)) {
    collectExceptions(
      context,
      new ConfigError('Connection should be an object.', { received: connection, configKey })
    );
    return false;
  }
  if (type.isUndefined(connection.id)) {
    collectExceptions(context, new ConfigError('Connection id missing.', { configKey }));
    return false;
  }
  if (!type.isString(connection.id)) {
    collectExceptions(
      context,
      new ConfigError('Connection id is not a string.', { received: connection.id, configKey })
    );
    return false;
  }
  if (type.isNone(connection.type)) {
    collectExceptions(
      context,
      new ConfigError(`Connection type is not defined at connection "${connection.id}".`, {
        configKey,
      })
    );
    return false;
  }
  if (!type.isString(connection.type)) {
    collectExceptions(
      context,
      new ConfigError(`Connection type is not a string at connection "${connection.id}".`, {
        received: connection.type,
        configKey,
      })
    );
    return false;
  }
  return true;
}

// The app's organizations policy sets the scoping default for every
// connection (amendment-3): under policy: tenant a connection whose type
// implements the scoping contract is scoped unless it declares
// tenant: shared. The connection position therefore accepts only the
// exception — "shared", or { field } to scope on a non-default field.
// tenant: true restates the default and is rejected naming its replacement.
//
// The value grammar is the one every tenant declaration uses: "shared", or
// the bare name of the top-level field that carries the tenant id - the same
// spelling collections.<name>.tenant takes. The { field } object form is the
// v7 spelling and is deprecated; it normalises to the same internal model.
//
// The wall is only real if the connection type implements the scoping
// contract — a declared-but-unenforced wall would read as protection while
// providing none — so any tenant: declaration on a type without the contract
// is a build error under both policies, never a silent no-op. And because
// silence now means scoped, every connection type used under policy: tenant
// must declare its capability in connectionMetas in its types.js —
// { tenant: true } implements the contract, { tenant: false } is
// non-scopable (object storage, SMTP) — so a data-bearing type that never
// considered tenancy can not be silently unscoped.
function validateTenant(connection, context, { tenantPolicy }) {
  const configKey = connection['~k'];
  const connectionMeta = context.typesMap?.connectionMetas?.[connection.type];
  if (!type.isUndefined(connection.tenant)) {
    if (connection.tenant === true) {
      collectExceptions(
        context,
        new ConfigError(
          `Connection "tenant: true" was removed at connection "${connection.id}" — under auth.organizations.policy: tenant a scoping-capable connection is scoped by default, so the declaration restates the default. Remove the key, or declare tenant: shared for data deliberately shared across organizations.`,
          { configKey }
        )
      );
      return false;
    }
    if (connection.tenant === 'none' || connection.tenant === 'authored') {
      collectExceptions(
        context,
        new ConfigError(
          `Connection "tenant" does not accept "${connection.tenant}" at connection "${connection.id}" — "none" and "authored" are declared on the request, step or websocket that needs the exception, not on the connection.`,
          { configKey }
        )
      );
      return false;
    }
    const valid =
      type.isString(connection.tenant) ||
      (type.isObject(connection.tenant) && type.isString(connection.tenant.field));
    if (!valid) {
      collectExceptions(
        context,
        new ConfigError(
          `Connection "tenant" should be "shared" or a tenant field name at connection "${connection.id}".`,
          { received: connection.tenant, configKey }
        )
      );
      return false;
    }
    // The wall stamps and matches the field as a single top-level document
    // key ({ [field]: value }), so a dotted path would stamp a literal
    // dotted key that path-based read filters never match, and the authored
    // scan could not see nested writes onto it - both silent wall breaks.
    if (connection.tenant !== 'shared') {
      const field = type.isString(connection.tenant) ? connection.tenant : connection.tenant.field;
      if (field === '' || field.includes('.')) {
        collectExceptions(
          context,
          new ConfigError(
            `Connection "tenant" should name a non-empty top-level field (no dots) at connection "${connection.id}" — the tenant wall stamps and matches it as a single document key.`,
            { received: field, configKey }
          )
        );
        return false;
      }
    }
    if (connectionMeta?.tenant !== true) {
      collectExceptions(
        context,
        new ConfigError(
          `Connection type "${connection.type}" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "${connection.id}". Use a connection type that enforces the tenant wall.`,
          { configKey }
        )
      );
      return false;
    }
  }
  if (tenantPolicy && type.isUndefined(connectionMeta?.tenant)) {
    collectExceptions(
      context,
      new ConfigError(
        `Connection type "${connection.type}" declares no tenant capability at connection "${connection.id}". Under auth.organizations.policy: tenant every connection type must declare connectionMetas tenant: true (implements the tenant scoping contract) or tenant: false (non-scopable), so no connection is ever silently unscoped.`,
        { configKey }
      )
    );
  }
  return true;
}

// One internal model for the tenant declaration: "shared", or { field }. The
// artifact the runtime reads (resolveTenant) and every build consumer
// (tenantConnections, connectionCollections, buildCollections) see the object
// form whichever spelling the author used, so the grammar change is a build
// concern only.
function normalizeTenant(connection, context) {
  if (type.isUndefined(connection.tenant) || connection.tenant === 'shared') return;
  if (type.isObject(connection.tenant)) {
    context.handleWarning(
      new ConfigWarning(
        `Connection "tenant: { field: ${connection.tenant.field} }" is deprecated at connection "${connection.id}". Write the tenant field name as a bare string — tenant: ${connection.tenant.field} — the grammar collections: already uses.`,
        { configKey: connection['~k'], checkSlug: 'tenant-grammar' }
      )
    );
    return;
  }
  connection.tenant = { field: connection.tenant };
}

function literalBoolean(value, fallback) {
  if (type.isBoolean(value)) {
    return value;
  }
  return fallback;
}

function buildConnections({ components, context }) {
  // Store connection IDs for validation in buildRequests
  context.connectionIds = new Set();
  // Walled connection id -> { type, field } - scoping-capable type, no
  // tenant: shared - for the best-effort entry-stage check on requests and
  // steps (validateTenantPipeline) and the tenant audit rules in
  // checks/tenant, which need the tenant field name each connection stamps
  // and matches. Populated only under the tenant policy - the wall does not
  // engage under pinned, so demanding an authored clause there would be a
  // false alarm for a filter that never runs.
  context.tenantConnections = new Map();
  // Collection name -> { shared: [connectionId], scoped: [connectionId] } for
  // every scoping-capable connection with a literal properties.collection.
  // A pipeline names collections, connections name collections; joining the
  // two at build is what lets validateTenantPipeline refuse a scoped
  // pipeline that $lookups a tenant: shared collection the injected $match
  // can never satisfy. An operator-valued collection name is unknowable here
  // and is left out rather than guessed. Same policy guard as
  // tenantConnections - the wall does not engage under pinned. Small and
  // internal by design: the collections: declaration supersedes it.
  context.tenantCollectionMap = {};
  // Every connection's collection binding, for buildCollections to join the
  // app-level collections: declaration onto - { connectionId, type,
  // collection, dynamicCollection, tenant, read, write, configKey }. Under
  // every policy and for every type: any connection type that names a
  // collection string participates in the declaration. A collection named
  // by an operator can not be joined (connection properties are never
  // evaluated at build) and is recorded as dynamicCollection for the
  // check-only rule that reports it.
  context.connectionCollections = [];
  const tenantPolicy = components.auth?.organizations?.policy === 'tenant';

  const checkDuplicateConnectionId = createCheckDuplicateId({
    message: 'Duplicate connectionId "{{ id }}".',
  });

  (components.connections ?? []).forEach((connection) => {
    if (!validateConnection(connection, context)) return;

    const configKey = connection['~k'];

    checkDuplicateConnectionId({ id: connection.id, configKey });
    validateId({ id: connection.id, field: 'Connection id', configKey });
    if (validateTenant(connection, context, { tenantPolicy })) {
      normalizeTenant(connection, context);
    }

    // Track type usage for buildTypes validation
    context.typeCounters.connections.increment(connection.type, configKey);

    // Store connectionId for request validation and rename id
    connection.connectionId = connection.id;
    context.connectionIds.add(connection.connectionId);
    // Stamp the build-validated tenant capability onto the connection
    // artifact, so the runtime check in resolveTenant reads the SAME
    // declaration validateTenant just validated (types.js connectionMetas)
    // instead of requiring every connection package to mirror it onto its
    // runtime export — which only MongoDBCollection did, so every other type
    // (SMTP, SendGrid, AxiosHttp, the AI connections, third-party plugins)
    // threw on first use under policy: tenant. Only the two valid booleans
    // are stamped: an absent declaration stays absent, keeping the runtime
    // fail-closed error for artifacts of types that declare nothing. A
    // runtime meta.tenant still wins over the stamp (resolveTenant), and a
    // stamp of true without runtime enforcement refuses rather than serves,
    // so a drifted artifact can never silently unscope.
    const tenantCapability = context.typesMap?.connectionMetas?.[connection.type]?.tenant;
    if (tenantCapability === true || tenantCapability === false) {
      connection.tenantCapability = tenantCapability;
    }
    if (tenantPolicy && tenantCapability === true) {
      const shared = connection.tenant === 'shared';
      if (!shared) {
        context.tenantConnections.set(connection.connectionId, {
          type: connection.type,
          field: type.isObject(connection.tenant) ? connection.tenant.field : 'organization_id',
        });
      }
      const collection = connection.properties?.collection;
      if (type.isString(collection)) {
        context.tenantCollectionMap[collection] ??= { shared: [], scoped: [] };
        context.tenantCollectionMap[collection][shared ? 'shared' : 'scoped'].push(
          connection.connectionId
        );
      }
    }
    const collectionName = connection.properties?.collection;
    context.connectionCollections.push({
      connectionId: connection.connectionId,
      type: connection.type,
      collection: type.isString(collectionName) ? collectionName : undefined,
      dynamicCollection: type.isObject(collectionName),
      tenant: connection.tenant,
      // MongoDBCollection defaults: read on, write off. Only a literal boolean
      // is judged; an operator-valued flag keeps the default.
      read: literalBoolean(connection.properties?.read, true),
      write: literalBoolean(connection.properties?.write, false),
      configKey,
    });
    connection.id = `connection:${connection.id}`;

    // Count operators in connection properties
    countOperators(connection.properties ?? {}, {
      counter: context.typeCounters.operators.server,
    });
  });

  return components;
}

export default buildConnections;
