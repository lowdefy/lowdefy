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

const snapshotKeys = ['from', 'connections', 'scope', 'limit'];
const connectionKeys = ['id', 'scope', 'limit', 'sort', 'omit'];

function validateScope({ scope, where, fail }) {
  if (
    !type.isObject(scope) ||
    !type.isString(scope.field) ||
    !type.isArray(scope.values) ||
    Object.keys(scope).some((key) => !['field', 'values'].includes(key))
  ) {
    fail(`${where} should be { field: <field path>, values: [...] }.`);
  }
}

function validateLimit({ limit, where, fail }) {
  if (!type.isInt(limit) || limit < 1) {
    fail(`${where} should be a whole number above 0. Received ${JSON.stringify(limit)}.`);
  }
}

function validateConnection({ connection, index, fail }) {
  const where = `snapshot.connections[${index}]`;
  if (type.isString(connection)) return;
  if (!type.isObject(connection) || !type.isString(connection.id)) {
    fail(`${where} should be a connection id or { id, scope?, limit?, sort?, omit? }.`);
  }
  Object.keys(connection).forEach((key) => {
    if (!connectionKeys.includes(key)) {
      fail(`${where} has unknown key "${key}". Allowed: ${connectionKeys.join(', ')}.`);
    }
  });
  if (!type.isUndefined(connection.scope) && connection.scope !== false) {
    validateScope({ scope: connection.scope, where: `${where}.scope`, fail });
  }
  if (!type.isUndefined(connection.limit)) {
    validateLimit({ limit: connection.limit, where: `${where}.limit`, fail });
  }
  if (!type.isUndefined(connection.sort) && !type.isObject(connection.sort)) {
    fail(`${where}.sort should be an object, e.g. { created_at: -1 }.`);
  }
  if (
    !type.isUndefined(connection.omit) &&
    (!type.isArray(connection.omit) || !connection.omit.every((field) => type.isString(field)))
  ) {
    fail(`${where}.omit should be a list of field paths.`);
  }
}

// What `lowdefy data pull` copies. There is no default list: a collection is copied because
// someone named it.
function validateDataSetSnapshot({ snapshot, fail }) {
  if (type.isNone(snapshot)) return null;
  if (!type.isObject(snapshot)) {
    fail('"snapshot" should be an object with "from" and "connections".');
  }
  Object.keys(snapshot).forEach((key) => {
    if (!snapshotKeys.includes(key)) {
      fail(`snapshot has unknown key "${key}". Allowed: ${snapshotKeys.join(', ')}.`);
    }
  });
  if (!type.isString(snapshot.from)) {
    fail('snapshot.from should name the config.environments environment to pull from.');
  }
  if (!type.isArray(snapshot.connections) || snapshot.connections.length === 0) {
    fail('snapshot.connections should list the connections to copy; nothing else is copied.');
  }
  snapshot.connections.forEach((connection, index) => {
    validateConnection({ connection, index, fail });
  });
  if (!type.isUndefined(snapshot.scope)) {
    validateScope({ scope: snapshot.scope, where: 'snapshot.scope', fail });
  }
  if (!type.isUndefined(snapshot.limit)) {
    validateLimit({ limit: snapshot.limit, where: 'snapshot.limit', fail });
  }
  return snapshot;
}

export default validateDataSetSnapshot;
