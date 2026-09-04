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
import { get, set, type } from '@lowdefy/helpers';

function sourceLabel(definition) {
  if (type.isString(definition.package)) {
    return definition.package;
  }
  return definition.relativePath;
}

function toDefinition({
  connectionType,
  file,
  hazards,
  meta,
  originalTypeName,
  packageId,
  relativePath,
  schema,
}) {
  const definition = {
    package: null,
    packageId,
    originalTypeName,
    version: null,
    file,
    relativePath,
  };
  // A request type is only reachable through the connection that owns it, so
  // the docs surfaces need the connection name beside the request name.
  if (connectionType !== undefined) definition.connectionType = connectionType;
  if (meta !== undefined) definition.meta = meta;
  if (schema !== undefined) definition.schema = schema;
  if (hazards !== undefined) definition.hazards = hazards;
  return definition;
}

// A connection's capability meta lives in typesMap.connectionMetas, beside the
// package declarations from types.js connectionMetas, because that is the one
// map buildConnections reads to know whether a connection type implements the
// tenant scoping contract. Without this a file connection would declare
// nothing and be refused under auth.organizations.policy: tenant.
function addConnectionMeta({ record, typesMap }) {
  if (record.kind !== 'connections' || type.isNone(record.meta)) return;
  if (!type.isObject(typesMap.connectionMetas)) {
    typesMap.connectionMetas = {};
  }
  typesMap.connectionMetas[record.typeName] = record.meta;
}

/**
 * Writes discovered file-plugin records into a typesMap, keyed by type name
 * under the record's kind.
 *
 * A type name a package already defines is a collision, not an override: the
 * package type stays and the collision is returned for the build to report.
 */
function addFilePluginTypes({ records, typesMap }) {
  const collisions = [];
  for (const record of records) {
    let store = get(typesMap, record.kind);
    if (type.isNone(store)) {
      store = {};
      set(typesMap, record.kind, store);
    }
    const existing = store[record.typeName];
    if (!type.isNone(existing)) {
      collisions.push(
        new ConfigError(
          `${record.typeClass} type "${record.typeName}" is defined by ${
            record.relativePath
          } and by ${sourceLabel(existing)}.`,
          {
            filePath: record.relativePath,
            lineNumber: 1,
            checkSlug: record.checkSlug,
          }
        )
      );
      continue;
    }
    store[record.typeName] = toDefinition(record);
    addConnectionMeta({ record, typesMap });
  }
  return collisions;
}

export default addFilePluginTypes;
