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

import readBuildArtifact from './readBuildArtifact.js';

// The connection artifact keeps the literal `read` / `write` flags; an
// operator-valued flag can not be judged at build and keeps the
// MongoDBCollection default (read on, write off), the same rule
// packages/build/src/build/buildConnections.js applies for collections.json.
function literalBoolean(value, fallback) {
  if (type.isBoolean(value)) {
    return value;
  }
  return fallback;
}

// A connection's effective tenant verdict. An explicit declaration wins
// ("shared" or { field }). Under auth.organizations.policy: tenant a
// scoping-capable connection that declares nothing is scoped on the default
// field — the build records that resolved field in tenantCollections.json
// (writeConnections.js) — so an undeclared connection reads as scoped there,
// and as null (unscoped) under the default policy.
function resolveTenant({ connection, tenantConnections }) {
  if (!type.isUndefined(connection.tenant)) {
    return connection.tenant;
  }
  const scoped = tenantConnections[connection.connectionId];
  if (type.isObject(scoped) && type.isString(scoped.field)) {
    return { field: scoped.field };
  }
  return null;
}

// The connection → collection join every data-layer consumer needs (the data
// model tool, write validation, migrations): which collection each built
// connection addresses, with its read/write flags and tenant verdict. Reads
// build/connectionIds.json and build/connections/<id>.json fresh on every
// call, like the other docs modules.
//
// Returns { connections, unresolved }:
//   connections[connectionId] = { connectionId, type, collection, read, write, tenant }
//     where `collection` is the literal collection name, or null for a
//     connection that names no collection at all (an HTTP or SMTP
//     connection) or names it with an operator.
//   unresolved = [{ connectionId, reason }] for every connection whose
//     collection is operator-valued — it is a data connection, but the join
//     can not be made at build, so callers must never treat it as "no
//     collection".
function resolveCollectionJoin() {
  const connectionIds = readBuildArtifact({ name: 'connectionIds.json' }) ?? [];
  const tenantCollections = readBuildArtifact({ name: 'tenantCollections.json' }) ?? {};
  const tenantConnections = tenantCollections.tenantConnections ?? {};

  const connections = {};
  const unresolved = [];

  connectionIds.forEach((connectionId) => {
    const connection = readBuildArtifact({
      name: `connections/${connectionId}.json`,
      deserialize: true,
    });
    if (type.isNone(connection)) {
      unresolved.push({
        connectionId,
        reason: `connection "${connectionId}" is listed in connectionIds.json but has no build artifact`,
      });
      return;
    }
    const collectionName = connection.properties?.collection;
    let collection = null;
    if (type.isString(collectionName)) {
      collection = collectionName;
    } else if (!type.isUndefined(collectionName)) {
      unresolved.push({
        connectionId,
        reason: `connection "${connectionId}" has an operator-valued "collection" property, so its collection can not be resolved at build`,
      });
    }
    connections[connectionId] = {
      connectionId,
      type: connection.type ?? null,
      collection,
      read: literalBoolean(connection.properties?.read, true),
      write: literalBoolean(connection.properties?.write, false),
      tenant: resolveTenant({ connection, tenantConnections }),
    };
  });

  return { connections, unresolved };
}

export default resolveCollectionJoin;
