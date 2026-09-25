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

import { get, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';

// A tenant: shared connection's writes belong to no organization, so its
// change-log records carry no tenant field: there is no verdict to stamp, and
// stamping one from the written document or the caller would put a record in
// an organization the wall never verified. A walled collection can not hold
// such a record - every walled read filters it out and the tenant preflight
// refuses to serve the app once one exists. So a shared connection may not
// change-log into a collection a scoped connection reads.
//
// The connection type declares where its properties name the physical
// collection (connectionMetas tenantTarget): the database properties, the
// collection property, and the change-log collection property. Two targets
// match when their collection names are the same literal string and their
// database properties are equal as authored. Names resolved at runtime
// (_secret, _payload) can not be compared and are skipped.

function comparable(value) {
  return JSON.stringify(value ?? null, (key, item) => (key.startsWith('~') ? undefined : item));
}

function targetKey({ connection, tenantTarget, collectionPath }) {
  const collection = get(connection.properties, collectionPath);
  if (!type.isString(collection)) {
    return null;
  }
  const database = tenantTarget.database.map((path) => get(connection.properties, path));
  return comparable([connection.type, database, collection]);
}

function validateSharedChangeLog({ connections, context }) {
  const connectionMetas = context.typesMap?.connectionMetas ?? {};
  const scoped = new Map();
  connections.forEach((connection) => {
    if (!context.tenantConnectionIds.has(connection.connectionId)) return;
    const tenantTarget = connectionMetas[connection.type]?.tenantTarget;
    if (!tenantTarget) return;
    const key = targetKey({ connection, tenantTarget, collectionPath: tenantTarget.collection });
    if (key === null || scoped.has(key)) return;
    scoped.set(key, connection.connectionId);
  });
  connections.forEach((connection) => {
    if (connection.tenant !== 'shared') return;
    const tenantTarget = connectionMetas[connection.type]?.tenantTarget;
    if (!tenantTarget) return;
    const key = targetKey({
      connection,
      tenantTarget,
      collectionPath: tenantTarget.changeLogCollection,
    });
    if (!scoped.has(key)) return;
    const logCollection = get(connection.properties, tenantTarget.changeLogCollection);
    const scopedConnectionId = scoped.get(key);
    collectExceptions(
      context,
      new ConfigError(
        `Connection "${connection.connectionId}" is tenant: shared but change-logs into collection "${logCollection}", which scoped connection "${scopedConnectionId}" reads. A shared connection's change-log records belong to no organization and carry no tenant field, so in a walled collection they are invisible to every walled read and make the tenant preflight refuse to serve the app. Point this connection's change log at a collection no scoped connection reads.`,
        { configKey: connection['~k'] }
      )
    );
  });
}

export default validateSharedChangeLog;
