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
  // Row b's email is stale, and its pitch, which reads the email, waits for it in the same run.
  expect(stale).toMatchObject({ queued: 2, missingInputs: 0 });
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

test('a column and the column that reads it, enqueued together, run one after the other', async () => {
  const documents = [
    { _id: 'a', org: 'o1', name: 'Acme', domain: 'acme.test' },
    { _id: 'b', org: 'o1', name: 'Bolt', domain: 'bolt.test' },
  ];
  const { collection, connection } = await setupEnrichmentCollection({ name, documents });
  const before = Date.now();
  const enqueued = await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, filter, columns: ['pitch', 'email'] },
    connection,
  });
  expect(enqueued).toMatchObject({ queued: 4, missingInputs: 0 });
  const queuedDocs = await readDocuments(collection);
  // The pitch is queued waiting for the email, never "Missing input", and is not due yet.
  expect(queuedDocs[0]._enrich.pitch).toMatchObject({ status: 'queued', waitingFor: ['email'] });
  expect(queuedDocs[0]._enrich.pitch.queuedAt.getTime()).toBeGreaterThan(before + 60000);
  expect(queuedDocs[0]._enrich.email).toMatchObject({ status: 'queued' });
  expect(queuedDocs[0]._enrich.email).not.toHaveProperty('waitingFor');

  // The first claim takes only the emails: the pitches wait.
  const first = await MongoDBEnrichmentClaim({
    request: { fields, columnDefs, filter, limit: 10 },
    connection,
  });
  expect(first.map((item) => item.columnKey)).toEqual(['email', 'email']);
  const completed = await MongoDBEnrichmentComplete({
    request: {
      columnDefs,
      filter,
      results: first.map((item) => ({
        rowKey: item.rowKey,
        columnKey: item.columnKey,
        claimToken: item.claimToken,
        ...provider(item),
      })),
    },
    connection,
  });
  expect(completed).toMatchObject({ applied: 2, released: 2 });
  // Released as soon as the email completed: due now, no 15 second wait.
  const released = await readDocuments(collection);
  expect(released[0]._enrich.pitch).not.toHaveProperty('waitingFor');
  expect(released[0]._enrich.pitch.queuedAt.getTime()).toBeLessThanOrEqual(Date.now());

  const second = await MongoDBEnrichmentClaim({
    request: { fields, columnDefs, filter, limit: 10 },
    connection,
  });
  expect(second.map((item) => [item.rowKey, item.columnKey])).toEqual([
    ['a', 'pitch'],
    ['b', 'pitch'],
  ]);
  expect(second[0].inputs).toEqual({ name: 'Acme', email: 'hello@acme.test' });
});

test('a cell waiting for a column that fails for good is released and finds its input missing', async () => {
  const documents = [{ _id: 'a', org: 'o1', name: 'Acme', domain: 'acme.test' }];
  const { collection, connection } = await setupEnrichmentCollection({ name, documents });
  await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, filter, columns: ['email', 'pitch'] },
    connection,
  });
  const [emailClaim] = await MongoDBEnrichmentClaim({
    request: { fields, columnDefs, filter, limit: 10 },
    connection,
  });
  await MongoDBEnrichmentComplete({
    request: {
      columnDefs,
      filter,
      results: [
        {
          rowKey: 'a',
          columnKey: 'email',
          claimToken: emailClaim.claimToken,
          status: 'error',
          error: 'No such domain.',
          retry: false,
        },
      ],
    },
    connection,
  });
  await expect(
    MongoDBEnrichmentClaim({ request: { fields, columnDefs, filter, limit: 10 }, connection })
  ).resolves.toEqual([]);
  const docs = await readDocuments(collection);
  expect(docs[0]._enrich.pitch).toMatchObject({ status: 'empty', error: 'Missing input: email' });
});

test('a claim parks a cell whose input is still running until that input completes', async () => {
  const documents = [{ _id: 'a', org: 'o1', name: 'Acme', domain: 'acme.test' }];
  const { collection, connection } = await setupEnrichmentCollection({ name, documents });
  await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, filter, columns: ['email'] },
    connection,
  });
  const [emailClaim] = await MongoDBEnrichmentClaim({
    request: { fields, columnDefs, filter, limit: 10 },
    connection,
  });
  // A second enqueue of the pitch alone, while the email runs: it waits for the email.
  await MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, filter, columns: ['pitch'] },
    connection,
  });
  const parked = await readDocuments(collection);
  expect(parked[0]._enrich.pitch).toMatchObject({ status: 'queued', waitingFor: ['email'] });
  await MongoDBEnrichmentComplete({
    request: {
      columnDefs,
      filter,
      results: [
        {
          rowKey: 'a',
          columnKey: 'email',
          claimToken: emailClaim.claimToken,
          ...provider(emailClaim),
        },
      ],
    },
    connection,
  });
  const claims = await MongoDBEnrichmentClaim({
    request: { fields, columnDefs, filter, limit: 10 },
    connection,
  });
  expect(claims.map((item) => item.columnKey)).toEqual(['pitch']);
});
