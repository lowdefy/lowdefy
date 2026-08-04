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
import { ConfigError } from '@lowdefy/errors';

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
    collectExceptions(
      context,
      new ConfigError('Connection id missing.', { configKey })
    );
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
      return;
    }
    if (connection.tenant === 'none' || connection.tenant === 'authored') {
      collectExceptions(
        context,
        new ConfigError(
          `Connection "tenant" does not accept "${connection.tenant}" at connection "${connection.id}" — "none" and "authored" are declared on the request, step or websocket that needs the exception, not on the connection.`,
          { configKey }
        )
      );
      return;
    }
    const valid =
      connection.tenant === 'shared' ||
      (type.isObject(connection.tenant) && type.isString(connection.tenant.field));
    if (!valid) {
      collectExceptions(
        context,
        new ConfigError(
          `Connection "tenant" should be "shared" or an object with a "field" string at connection "${connection.id}".`,
          { received: connection.tenant, configKey }
        )
      );
      return;
    }
    if (connectionMeta?.tenant !== true) {
      collectExceptions(
        context,
        new ConfigError(
          `Connection type "${connection.type}" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "${connection.id}". Use a connection type that enforces the tenant wall.`,
          { configKey }
        )
      );
      return;
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
}

function buildConnections({ components, context }) {
  // Store connection IDs for validation in buildRequests
  context.connectionIds = new Set();
  // Scoped connection ids - scoping-capable type, no tenant: shared - for
  // the best-effort entry-stage check on requests and steps
  // (validateTenantPipelineEntry). Populated only under the tenant policy -
  // the wall does not engage under pinned, so demanding an authored clause
  // there would be a false alarm for a filter that never runs.
  context.tenantConnectionIds = new Set();
  const tenantPolicy = components.auth?.organizations?.policy === 'tenant';

  const checkDuplicateConnectionId = createCheckDuplicateId({
    message: 'Duplicate connectionId "{{ id }}".',
  });

  (components.connections ?? []).forEach((connection) => {
    if (!validateConnection(connection, context)) return;

    const configKey = connection['~k'];

    checkDuplicateConnectionId({ id: connection.id, configKey });
    validateId({ id: connection.id, field: 'Connection id', configKey });
    validateTenant(connection, context, { tenantPolicy });

    // Track type usage for buildTypes validation
    context.typeCounters.connections.increment(connection.type, configKey);

    // Store connectionId for request validation and rename id
    connection.connectionId = connection.id;
    context.connectionIds.add(connection.connectionId);
    if (
      tenantPolicy &&
      context.typesMap?.connectionMetas?.[connection.type]?.tenant === true &&
      connection.tenant !== 'shared'
    ) {
      context.tenantConnectionIds.add(connection.connectionId);
    }
    connection.id = `connection:${connection.id}`;

    // Count operators in connection properties
    countOperators(connection.properties ?? {}, {
      counter: context.typeCounters.operators.server,
    });
  });

  return components;
}

export default buildConnections;
