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

import getConnectionConfig from '../connections/getConnectionConfig.js';

// Walks a built routine (arrays, control objects, nested :do/:then/:else
// branches) and returns every connectionId a request step names. Controls
// carry no connectionId themselves, so any object with a string connectionId
// is a request step.
function collectConnectionIds(node, ids = new Set()) {
  if (type.isArray(node)) {
    node.forEach((item) => collectConnectionIds(item, ids));
    return ids;
  }
  if (!type.isObject(node)) {
    return ids;
  }
  if (type.isString(node.connectionId)) {
    ids.add(node.connectionId);
  }
  Object.values(node).forEach((value) => collectConnectionIds(value, ids));
  return ids;
}

// Best-effort database name from a resolved connection: the pathname of a
// MongoDB-style URI. Anything else reports null rather than guessing.
function databaseNameOf(properties) {
  const uri = properties?.databaseUri;
  if (!type.isString(uri)) {
    return null;
  }
  try {
    const name = new URL(uri).pathname.replace(/^\//, '').split('?')[0];
    return name === '' ? null : name;
  } catch {
    return null;
  }
}

// Names what a migrate run will touch before it touches it (design D13): for
// each distinct connection the pending migrations use, the connection id, its
// type and the database its properties resolve to in THIS environment. A
// connection that fails to resolve (a missing secret, say) is still listed,
// with the failure, so the operator sees the problem before any write.
async function describeMigrationTargets(context, { pending }) {
  const connectionIds = new Set();
  for (const migration of pending) {
    const artifact = await context.readConfigFile(`migrations/${migration.id}.json`);
    collectConnectionIds(artifact?.routine, connectionIds);
  }
  const targets = [];
  for (const connectionId of [...connectionIds].sort()) {
    try {
      const connection = await getConnectionConfig(context, { connectionId });
      const properties = context.evaluateOperators({
        input: connection.properties ?? {},
        location: connectionId,
      });
      targets.push({
        connectionId,
        type: connection.type,
        database: databaseNameOf(properties),
      });
    } catch (error) {
      targets.push({ connectionId, type: null, database: null, error: error.message });
    }
  }
  return targets;
}

export { collectConnectionIds, databaseNameOf };
export default describeMigrationTargets;
