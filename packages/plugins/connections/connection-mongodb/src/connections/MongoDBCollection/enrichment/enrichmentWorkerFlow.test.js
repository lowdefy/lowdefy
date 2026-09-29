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

import MongoDBEnrichmentClaim from '../MongoDBEnrichmentClaim/MongoDBEnrichmentClaim.js';
import MongoDBEnrichmentComplete from '../MongoDBEnrichmentComplete/MongoDBEnrichmentComplete.js';
import MongoDBEnrichmentEnqueue from '../MongoDBEnrichmentEnqueue/MongoDBEnrichmentEnqueue.js';
import MongoDBTableQuery from '../MongoDBTableQuery/MongoDBTableQuery.js';
import hashEnrichmentInputs from './hashEnrichmentInputs.js';
import {
  columnDefs,
  fields,
  readDocuments,
  setupEnrichmentCollection,
  updateDocuments,
} from '../../../../test/enrichmentTable.js';

const name = 'enrichmentWorker';
const filter = { org: 'o1' };

// The worker routine the docs describe: claim a batch, call the provider of each cell, complete
// the batch and enqueue the downstream columns, until nothing is claimed.
async function runWorker({ connection, provider }) {
  let rounds = 0;
  for (;;) {
    const claims = await MongoDBEnrichmentClaim({
      request: { fields, columnDefs, filter, limit: 5 },
      connection,
    });
    if (claims.length === 0) return rounds;
    rounds += 1;
    const results = claims.map((item) => ({
      rowKey: item.rowKey,
      columnKey: item.columnKey,
      claimToken: item.claimToken,
      ...provider(item),
    }));
    const { downstream } = await MongoDBEnrichmentComplete({
      request: { columnDefs, filter, results },
      connection,
    });
    for (const { rowKey, columns } of downstream) {
      await MongoDBEnrichmentEnqueue({
        request: { fields, columnDefs, filter, columns, selection: [rowKey] },
        connection,
      });
    }
  }
}

function provider(item) {
  if (item.columnKey === 'email') {
    return { status: 'ok', value: `hello@${item.inputs.domain}`, raw: { source: 'test' } };
  }
  return { status: 'ok', value: `Hi ${item.inputs.name}, ${item.inputs.email}` };
}

test('a run flows from enqueue through claims and completes to the downstream column', async () => {
  const documents = [
    { _id: 'a', org: 'o1', name: 'Acme', domain: 'acme.test' },
    { _id: 'b', org: 'o1', name: 'Bolt', domain: 'bolt.test' },
    { _id: 'c', org: 'o1', name: 'Crate', domain: '' },
  ];
  const { collection, connection } = await setupEnrichmentCollection({ name, documents });
  const enqueued = await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, filter, columns: ['email'] },
    connection,
  });
  expect(enqueued).toMatchObject({ queued: 2, missingInputs: 1 });
  await runWorker({ connection, provider });
  const docs = await readDocuments(collection);
  expect(docs[0]._enrich).toMatchObject({
    email: { status: 'ok', value: 'hello@acme.test', raw: { source: 'test' } },
    pitch: { status: 'ok', value: 'Hi Acme, hello@acme.test' },
  });
  expect(docs[0]._enrich.pitch.inputHash).toBe(
    hashEnrichmentInputs({ name: 'Acme', email: 'hello@acme.test' })
  );
  expect(docs[2]._enrich).toEqual({
    email: expect.objectContaining({ status: 'empty', error: 'Missing input: domain' }),
  });

  // The table reads the values through the email field, as it shows them.
  const table = await MongoDBTableQuery({
    request: { fields, pipeline: [{ $match: filter }], startRow: 0, endRow: 10 },
    connection,
  });
  expect(table.rows.map((row) => row._enrich?.email?.value ?? null)).toEqual([
    'hello@acme.test',
    'hello@bolt.test',
    null,
  ]);

  // An edited input makes the cell stale; a stale run recomputes only that cell, and the
  // downstream pitch follows through autoRun.
  await updateDocuments(collection, { _id: 'b' }, { $set: { domain: 'bolt.example' } });
  const stale = await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, filter, columns: ['email', 'pitch'], mode: 'stale' },
    connection,
  });
  expect(stale).toMatchObject({ queued: 1, missingInputs: 0 });
  await runWorker({ connection, provider });
  const after = await readDocuments(collection);
  expect(after[1]._enrich).toMatchObject({
    email: { status: 'ok', value: 'hello@bolt.example' },
    pitch: { status: 'ok', value: 'Hi Bolt, hello@bolt.example' },
  });
  expect(after[0]._enrich.email.finishedAt).toEqual(docs[0]._enrich.email.finishedAt);

  const fresh = await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, filter, columns: ['email', 'pitch'], mode: 'stale' },
    connection,
  });
  // Row c never had a result (its input is missing), so it has no inputHash to be stale against.
  expect(fresh).toMatchObject({ queued: 0, missingInputs: 0 });
});
