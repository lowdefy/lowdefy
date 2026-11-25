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

import deserializeFixture from './deserializeFixture.js';
import duplicateIndexName from './duplicateIndexName.js';

const DUPLICATE_KEY = 11000;

// One write per document, in load order: the generated documents of each connection, then the
// fixtures. A fixture with an _id replaces any earlier document with that _id; one without is
// inserted. Each write keeps what the load error names when it breaks a unique index.
function listWrites({ group }) {
  const writes = [];
  group.generated.forEach((batch) => {
    batch.documents.forEach((raw, index) => {
      const document = deserializeFixture(raw);
      writes.push({
        source: { kind: 'generated', connectionId: batch.connectionId, index, document },
        operation: { insertOne: { document } },
      });
    });
  });
  group.fixtures.forEach((fixture) => {
    const document = deserializeFixture(fixture.document);
    writes.push({
      source: { kind: 'fixture', connectionId: fixture.connectionId, index: fixture.index },
      operation: type.isUndefined(document._id)
        ? { insertOne: { document } }
        : { replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true } },
    });
  });
  return writes;
}

// A bulk write's error names the index but not the key as a value (the driver keeps only the
// server's message), so the write that broke it is made again alone, which fails on the same key
// and carries it: the ordered bulk write stopped there, so nothing after it was written.
async function readDuplicateKey({ collection, operation }) {
  try {
    if (!type.isUndefined(operation.insertOne)) {
      await collection.insertOne(operation.insertOne.document);
    } else {
      const { filter, replacement } = operation.replaceOne;
      await collection.replaceOne(filter, replacement, { upsert: true });
    }
  } catch (error) {
    return error.keyValue;
  }
  return undefined;
}

// A fixture that breaks a unique index names the fixture, the index, the duplicate key and the
// document that already holds it; a generated document names itself, its _id and the index.
// Loading indexes before documents is what lets this catch a document that collides with an
// earlier one.
async function describeDuplicate({ collection, dataSetName, operation, source, writeError }) {
  const { errmsg } = writeError;
  const index = duplicateIndexName(errmsg);
  if (source.kind === 'generated') {
    const duplicate = /dup key: (.*)$/.exec(errmsg)?.[1] ?? 'unknown';
    return new Error(
      `Data set "${dataSetName}" generated ${source.connectionId}[${
        source.index
      }] (_id ${JSON.stringify(
        source.document._id
      )}) breaks unique index "${index}": duplicate key ${duplicate}.`
    );
  }
  const keyValue = await readDuplicateKey({ collection, operation });
  const holder = type.isObject(keyValue)
    ? await collection.findOne(keyValue, { projection: { _id: 1 } })
    : null;
  const where = `Data set "${dataSetName}" fixture ${source.connectionId}[${source.index}]`;
  const heldBy = type.isNone(holder) ? '' : ` held by document _id ${JSON.stringify(holder._id)}`;
  return new Error(
    `${where} breaks unique index "${index}": duplicate key ${JSON.stringify(keyValue)}${heldBy}.`
  );
}

// Writes one collection's documents of a data set in one ordered bulkWrite, a round trip for the
// whole collection rather than one per fixture. Ordered, so the writes land in load order and the
// first that breaks a unique index stops the load, as one write at a time would.
async function seedDataSetCollection({ collection, dataSetName, group }) {
  const writes = listWrites({ group });
  if (writes.length === 0) return;
  try {
    await collection.bulkWrite(
      writes.map((write) => write.operation),
      { ordered: true }
    );
  } catch (error) {
    // An ordered bulk write stops at its first failure, so it holds one write error.
    const writeError = error.writeErrors?.[0];
    if (type.isNone(writeError) || writeError.code !== DUPLICATE_KEY) throw error;
    throw await describeDuplicate({
      collection,
      dataSetName,
      operation: writes[writeError.index].operation,
      source: writes[writeError.index].source,
      writeError,
    });
  }
}

export default seedDataSetCollection;
