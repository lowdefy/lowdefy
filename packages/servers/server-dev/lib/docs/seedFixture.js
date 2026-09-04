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

import { callConnectionRequest } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';
import { readFixture } from '@lowdefy/node-utils';

import { publish } from './devEventBus.js';
import isWriteRequestsAllowed from './isWriteRequestsAllowed.js';
import readBuildArtifact from './readBuildArtifact.js';

function getConfigDirectory() {
  return process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
}

// The collection name in the result is read from the built connection, the
// same artifact the API resolves the connection from; null when the connection
// resolves it with an operator, which the seeding itself still handles.
function getCollectionName({ connectionId }) {
  const connection = readBuildArtifact({
    name: `connections/${connectionId}.json`,
    deserialize: true,
  });
  const collection = connection?.properties?.collection;
  return type.isString(collection) ? collection : null;
}

// Every write goes through the connection layer as a synthetic request, so an
// operator-valued databaseUri resolves, a `write: false` connection refuses
// with its normal error and the request schema still applies. `tenant: null`
// is deliberate: a fixture is raw database content and carries its own tenant
// fields; stamping the caller's organisation onto every document would make a
// multi-organisation fixture impossible.
async function seedConnection({ context, connectionId, docs, reset }) {
  let deleted = 0;
  if (reset) {
    const { response } = await callConnectionRequest(context, {
      connectionId,
      requestId: `seed_fixture:${connectionId}:reset`,
      type: 'MongoDBDeleteMany',
      properties: { filter: {} },
      tenant: null,
    });
    deleted = response?.deletedCount ?? 0;
  }
  let inserted = 0;
  if (docs.length > 0) {
    const { response } = await callConnectionRequest(context, {
      connectionId,
      requestId: `seed_fixture:${connectionId}`,
      type: 'MongoDBInsertMany',
      properties: { docs },
      // A fixture document is data. Without this the operator pass would run
      // over the documents themselves, so a document with a `_secret` or `_js`
      // key would be executed instead of stored.
      rawProperties: true,
      tenant: null,
    });
    inserted = response?.insertedCount ?? docs.length;
  }
  return { connectionId, collection: getCollectionName({ connectionId }), deleted, inserted };
}

// Loads fixtures/<name>.yaml into the dev database through the connection
// layer, gated by the same write opt-in as lowdefy_run_request because it
// writes to the developer's real database. Never throws - refusals and
// failures come back as data so an agent can reason about them. `reset`
// defaults to false so fixtures layer onto existing data; with reset the
// fixture's collections are emptied first.
async function seedFixture({ name, reset = false, honoContext }) {
  if (type.isUndefined(name) || !type.isString(name)) {
    throw new ConfigError(
      `seed_fixture requires a "name" string. Received ${JSON.stringify(name)}.`
    );
  }
  if (!type.isBoolean(reset)) {
    throw new ConfigError(
      `seed_fixture "reset" must be a boolean. Received ${JSON.stringify(reset)}.`
    );
  }

  const allowed = await isWriteRequestsAllowed();
  if (!allowed) {
    return {
      refused: true,
      reason: 'Seeding writes to the dev database.',
      howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
    };
  }

  let fixture;
  try {
    fixture = await readFixture({ configDirectory: getConfigDirectory(), name });
  } catch (error) {
    return { refused: false, error: { name: error.name, message: error.message } };
  }
  const connectionIds = fixture.connections.map((connection) => connection.connectionId);

  // Deferred import: createLowdefyContext statically imports build/plugins/*
  // artifacts, which only exist in a running server directory — importing it
  // at module load would break every consumer of this module (e.g. the MCP
  // server) in environments without a full build.
  const { default: createLowdefyContext } = await import('../server/createLowdefyContext.js');
  const context = await createLowdefyContext({ c: honoContext, user: undefined });
  context.logger.info({ event: 'agent_seed_fixture', name, reset, connectionIds });

  const seeded = [];
  try {
    for (const { connectionId, docs } of fixture.connections) {
      seeded.push(await seedConnection({ context, connectionId, docs, reset }));
    }
  } catch (error) {
    // A partial failure still changed the database, so a watching agent is
    // told about it on the same event as a clean run.
    publish({ type: 'fixture_seeded', name, reset, seeded });
    return {
      refused: false,
      error: { name: error.name, message: error.message },
      seeded,
    };
  }
  publish({ type: 'fixture_seeded', name, reset, seeded });
  return { refused: false, seeded };
}

export default seedFixture;
