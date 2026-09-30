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

import { ConnectionString } from 'mongodb-connection-string-url';
import { type } from '@lowdefy/helpers';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';

// Warn when an unwalled connection holds a MongoDB URI that points at a walled
// connection's database. A non-scopable connection (SMTP, object storage, a
// plugin's own connection type) has no tenant wall, so a URI to the walled
// database in its properties is a way around it: the plugin should name the
// walled connection (mongoConnectionId) and use the walled client
// (@lowdefy/connection-mongodb/walled). A warning in this release, an error in
// the next.
//
// Two URIs point at the same database when their host sets and database names
// match. The walled connection's database name is its databaseName property,
// falling back to the path of its URI.

function parseMongoUri(value) {
  if (!type.isString(value) || !/^mongodb(\+srv)?:\/\//.test(value)) return null;
  try {
    const url = new ConnectionString(value);
    return { hosts: [...url.hosts].sort().join(','), database: url.pathname.replace(/^\//, '') };
  } catch (error) {
    return null;
  }
}

function collectUris(value, uris) {
  if (type.isString(value)) {
    const parsed = parseMongoUri(value);
    if (parsed) uris.push(parsed);
  } else if (type.isArray(value)) {
    value.forEach((item) => collectUris(item, uris));
  } else if (type.isObject(value)) {
    Object.values(value).forEach((item) => collectUris(item, uris));
  }
  return uris;
}

async function warnUnwalledReach(context, { targets }) {
  const unwalledConnections = await context.readConfigFile('unwalledConnections.json');
  if (!type.isArray(unwalledConnections) || unwalledConnections.length === 0) return;
  const walled = new Map();
  [...targets.values()].forEach((target) => {
    const parsed = parseMongoUri(target.properties?.databaseUri);
    if (!parsed) return;
    const database = target.properties.databaseName || parsed.database;
    walled.set(`${parsed.hosts}/${database}`, target.connectionIds[0]);
  });
  if (walled.size === 0) return;
  const evaluateOperators = createEvaluateOperators({ ...context, user: null });
  for (const entry of unwalledConnections) {
    const connectionConfig = await context.readConfigFile(`connections/${entry.connectionId}.json`);
    if (!connectionConfig) continue;
    let properties;
    try {
      properties = evaluateOperators({
        input: connectionConfig.properties || {},
        location: entry.connectionId,
        payload: {},
        state: {},
        steps: {},
      });
    } catch (error) {
      continue;
    }
    const reached = collectUris(properties, []).find(({ hosts, database }) =>
      walled.has(`${hosts}/${database}`)
    );
    if (reached) {
      context.logger.warn(
        `Connection "${entry.connectionId}" (${
          entry.type
        }) holds a URI to the database of walled connection "${walled.get(
          `${reached.hosts}/${reached.database}`
        )}". Unwalled connections must not reach walled data: give the plugin a mongoConnectionId and use the walled MongoDB client (@lowdefy/connection-mongodb/walled). This becomes a build error in the next release.`
      );
    }
  }
}

export default warnUnwalledReach;
