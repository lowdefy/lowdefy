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
import fs from 'fs';
import path from 'path';
import { serializer, type } from '@lowdefy/helpers';

// Resolves the collection a seed targets from the built connection artifact
// (design D17): properties.collection and properties.databaseName must be
// literal strings - an operator there is evaluated per request against secrets
// and state the runner does not have, so it cannot be seeded.
function resolveCollection({ connectionId, devDirectory }) {
  const filePath = path.join(devDirectory, 'build', 'connections', `${connectionId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Connection "${connectionId}" was not found in the build. Seeds are keyed by connectionId.`
    );
  }
  const connection = serializer.deserializeFromString(fs.readFileSync(filePath, 'utf8'));
  const properties = connection.properties ?? {};
  if (!type.isString(properties.collection)) {
    throw new Error(
      `Connection "${connectionId}" resolves its collection with an operator, so a seed cannot target it. Use a literal "collection" property, or seed through a request.`
    );
  }
  if (!type.isNone(properties.databaseName) && !type.isString(properties.databaseName)) {
    throw new Error(
      `Connection "${connectionId}" resolves its databaseName with an operator, so a seed cannot target it. Use a literal "databaseName" property, or seed through a request.`
    );
  }
  return { collection: properties.collection, databaseName: properties.databaseName };
}

async function dropCollection({ target }) {
  try {
    await target.drop();
  } catch (error) {
    // A collection that does not exist yet cannot be dropped; every other
    // driver failure is real and must surface.
    if (error.codeName !== 'NamespaceNotFound' && error.code !== 26) {
      throw error;
    }
  }
}

// MongoDB's ObjectId has no JSON form, so the connection plugin writes it as
// { _oid: '<hex>' } (connection-mongodb/.../serialize.js). The MCP seeder goes
// through that plugin and revives the marker; this seeder inserts with the raw
// driver, so it revives it here - the same fixture file must seed the same
// documents whichever seeder ran it.
function createReviver({ ObjectId }) {
  return function reviver(_, value) {
    if (type.isObject(value) && type.isString(value._oid)) {
      return ObjectId.createFromHexString(value._oid);
    }
    return value;
  };
}

// Drops every collection this run has ever seeded, then inserts the fixtures'
// documents in list order and the test's own `seed` documents last, so a test
// layers its specifics on a shared base and no test ever reads what an earlier
// test left behind - including a test that seeds nothing at all. `seeded` is the
// run-wide map of collections to clear, owned by the request-test session.
// `fixtures` is [{ name, connections: [{ connectionId, docs }] }] as readFixture
// returns it and `seed` is { connectionId: documents[] } - this file knows
// nothing about test or fixture files. `~d` markers become Dates and { _oid }
// markers become ObjectIds in both.
async function seedFixtures({ client, devDirectory, seed, fixtures, seeded, ObjectId }) {
  const reviver = createReviver({ ObjectId });
  const inserts = [];
  (fixtures ?? []).forEach((fixture) => {
    fixture.connections.forEach(({ connectionId, docs }) => {
      inserts.push({ connectionId, documents: serializer.copy(docs, { reviver }) });
    });
  });
  Object.keys(seed ?? {}).forEach((connectionId) => {
    inserts.push({ connectionId, documents: serializer.copy(seed[connectionId], { reviver }) });
  });

  // Resolve every connection before touching the database, so an unseedable
  // connection fails the test without a half-seeded state.
  const targets = new Map();
  inserts.forEach(({ connectionId }) => {
    if (targets.has(connectionId)) {
      return;
    }
    const { collection, databaseName } = resolveCollection({ connectionId, devDirectory });
    targets.set(connectionId, client.db(databaseName).collection(collection));
    seeded.set(connectionId, targets.get(connectionId));
  });

  for (const target of seeded.values()) {
    await dropCollection({ target });
  }
  for (const { connectionId, documents } of inserts) {
    if (documents.length > 0) {
      await targets.get(connectionId).insertMany(documents);
    }
  }
}

export default seedFixtures;
