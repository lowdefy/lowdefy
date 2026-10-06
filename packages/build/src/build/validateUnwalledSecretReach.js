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
import { type } from '@lowdefy/helpers';

// A plugin that opens its own MongoDB handle from the same secret as a walled
// connection reads and writes the walled database outside the wall. A
// connection whose type is non-scopable (meta.tenant: false, e.g. SMTP or a
// plugin's own connection type) that references the secret a walled
// connection's databaseUri names is exactly that. It should name the walled
// connection (mongoConnectionId) and use the walled client
// (@lowdefy/connection-mongodb/walled) instead.
function collectSecretNames(value, names) {
  if (type.isArray(value)) {
    value.forEach((item) => collectSecretNames(item, names));
  } else if (type.isObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      if (key === '_secret' && type.isString(item)) {
        names.add(item);
      } else if (!key.startsWith('~')) {
        collectSecretNames(item, names);
      }
    });
  }
  return names;
}

// The errors go straight onto context.errors rather than through
// collectExceptions: ~ignoreBuildChecks must not be a way around the wall.
function reportError(context, error) {
  if (!context.errors) {
    throw error;
  }
  context.errors.push(error);
}

function validateUnwalledSecretReach({ connections, context }) {
  const connectionMetas = context.typesMap?.connectionMetas ?? {};
  // secret name -> first walled connection whose databaseUri reads it
  const walledSecrets = new Map();
  connections.forEach((connection) => {
    if (!context.tenantConnectionIds.has(connection.connectionId)) return;
    collectSecretNames(connection.properties?.databaseUri, new Set()).forEach((name) => {
      if (!walledSecrets.has(name)) walledSecrets.set(name, connection.connectionId);
    });
  });
  if (walledSecrets.size === 0) return;
  connections.forEach((connection) => {
    if (connectionMetas[connection.type]?.tenant !== false) return;
    collectSecretNames(connection.properties, new Set()).forEach((name) => {
      if (!walledSecrets.has(name)) return;
      reportError(
        context,
        new ConfigError(
          `Connection "${connection.connectionId}" (${
            connection.type
          }) reads secret "${name}", the database of walled connection "${walledSecrets.get(
            name
          )}". Unwalled connections must not reach walled data: give the plugin a mongoConnectionId and use the walled MongoDB client (@lowdefy/connection-mongodb/walled).`,
          { configKey: connection['~k'] }
        )
      );
    });
  });
}

export default validateUnwalledSecretReach;
