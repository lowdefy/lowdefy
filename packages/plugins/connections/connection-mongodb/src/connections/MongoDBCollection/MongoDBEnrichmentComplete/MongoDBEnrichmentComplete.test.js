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
import { ObjectId } from 'mongodb';

import MongoDBEnrichmentClaim from '../MongoDBEnrichmentClaim/MongoDBEnrichmentClaim.js';
import MongoDBEnrichmentComplete from './MongoDBEnrichmentComplete.js';
import MongoDBEnrichmentEnqueue from '../MongoDBEnrichmentEnqueue/MongoDBEnrichmentEnqueue.js';
import hashEnrichmentInputs from '../enrichment/hashEnrichmentInputs.js';
import {
  columnDefs,
  fields,
  readDocuments,
  setupEnrichmentCollection,
  updateDocuments,
} from '../../../../test/enrichmentTable.js';

const name = 'enrichmentComplete';
const { checkRead, checkWrite } = MongoDBEnrichmentComplete.meta;

const minute = 60000;

function queued() {
  return { status: 'queued', runId: 'run1', attempts: 0, queuedAt: new Date(Date.now() - minute) };
}

function claim({ connection, tenant, ...properties }) {
  return MongoDBEnrichmentClaim({
    request: { fields, columnDefs, filter: { org: 'o1' }, ...properties },
    connection,
    tenant,
  });
}

function complete({ connection, tenant, tenantGuard, ...properties }) {
  return MongoDBEnrichmentComplete({
    request: { columnDefs, filter: { org: 'o1' }, ...properties },
    connection,
    tenant,
    tenantGuard,
    requestId: 'complete_request',
  });
}

function resultOf(item, overrides = {}) {
  return {
    rowKey: item.rowKey,
    columnKey: item.columnKey,
    claimToken: item.claimToken,
    status: 'ok',
    ...overrides,
  };
}

function cellOf(docs, _id, columnKey = 'email') {
  return docs.find((doc) => String(doc._id) === String(_id))?._enrich?.[columnKey];
}

async function makeDue(collection, _id, columnKey = 'email') {
  await updateDocuments(
    collection,
    { _id },
    { $set: { [`_enrich.${columnKey}.queuedAt`]: new Date(Date.now() - 1) } }
  );
}

test('checkRead should be false and checkWrite true', () => {
  expect(checkRead).toBe(false);
  expect(checkWrite).toBe(true);
});

test('an ok result stores the value, raw and the hash of the claimed inputs', async () => {
  const documents = [
    {
      _id: 'a',
      org: 'o1',
      domain: 'acme.test',
      _enrich: { email: { ...queued(), value: 'old', error: 'earlier' } },
    },
  ];
  const { collection, connection } = await setupEnrichmentCollection({ name, documents });
  const [item] = await claim({ connection });
  const response = await complete({
    connection,
    results: [
      resultOf(item, { value: 'ada@acme.test', raw: { confidence: 0.9, $meta: 'kept', 'a.b': 1 } }),
    ],
  });
  expect(response).toEqual({
    applied: 1,
    ignored: 0,
    requeued: 0,
    released: 0,
    downstream: [{ rowKey: 'a', columns: ['pitch'] }],
  });
  const docs = await readDocuments(collection);
  expect(cellOf(docs, 'a')).toEqual({
    status: 'ok',
    value: 'ada@acme.test',
    raw: { confidence: 0.9, $meta: 'kept', 'a.b': 1 },
    inputHash: hashEnrichmentInputs({ domain: 'acme.test' }),
    runId: 'run1',
    attempts: 1,
    claimToken: item.claimToken,
    queuedAt: expect.any(Date),
    startedAt: expect.any(Date),
    finishedAt: expect.any(Date),
  });
  const { _enrich, ...rest } = docs[0];
  expect(rest).toEqual({ _id: 'a', org: 'o1', domain: 'acme.test' });
});

test('an empty result clears the previous value', async () => {
  const documents = [
    { _id: 'a', org: 'o1', domain: 'acme.test', _enrich: { email: { ...queued(), value: 'old' } } },
  ];
  const { collection, connection } = await setupEnrichmentCollection({ name, documents });
  const [item] = await claim({ connection });
  await complete({ connection, results: [resultOf(item, { status: 'empty', raw: { hits: 0 } })] });
  const email = cellOf(await readDocuments(collection), 'a');
  expect(email).toMatchObject({ status: 'empty', raw: { hits: 0 } });
  expect(email.value).toBeUndefined();
});

describe('claim tokens', () => {
  test('a stale worker whose cell was claimed again is ignored', async () => {
    const documents = [{ _id: 'a', org: 'o1', domain: 'acme.test', _enrich: { email: queued() } }];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const [first] = await claim({ connection });
    await updateDocuments(
      collection,
      { _id: 'a' },
      { $set: { '_enrich.email.leaseUntil': new Date(Date.now() - 1) } }
    );
    const [second] = await claim({ connection });
    const stale = await complete({
      connection,
      results: [resultOf(first, { value: 'stale@acme.test' })],
    });
    expect(stale).toEqual({ applied: 0, ignored: 1, requeued: 0, released: 0, downstream: [] });
    expect(cellOf(await readDocuments(collection), 'a')).toMatchObject({
      status: 'running',
      claimToken: second.claimToken,
    });
    const fresh = await complete({
      connection,
      results: [resultOf(second, { value: 'fresh@acme.test' })],
    });
    expect(fresh.applied).toBe(1);
    expect(cellOf(await readDocuments(collection), 'a').value).toBe('fresh@acme.test');
  });

  test('a result sent twice is applied once', async () => {
    const documents = [{ _id: 'a', org: 'o1', domain: 'acme.test', _enrich: { email: queued() } }];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const [item] = await claim({ connection });
    await complete({ connection, results: [resultOf(item, { value: 'one' })] });
    const replay = await complete({ connection, results: [resultOf(item, { value: 'two' })] });
    expect(replay).toMatchObject({ applied: 0, ignored: 1 });
    expect(cellOf(await readDocuments(collection), 'a').value).toBe('one');
  });

  test('a cell re-queued by an enqueue while running ignores the old worker', async () => {
    const documents = [{ _id: 'a', org: 'o1', domain: 'acme.test', _enrich: { email: queued() } }];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const [item] = await claim({ connection, leaseMs: 1000 });
    await updateDocuments(
      collection,
      { _id: 'a' },
      { $set: { '_enrich.email.leaseUntil': new Date(Date.now() - 1) } }
    );
    await MongoDBEnrichmentEnqueue({
      request: { fields, columnDefs, columns: ['email'], filter: { org: 'o1' }, runId: 'run2' },
      connection,
    });
    const response = await complete({ connection, results: [resultOf(item, { value: 'late' })] });
    expect(response).toMatchObject({ applied: 0, ignored: 1 });
    expect(cellOf(await readDocuments(collection), 'a')).toMatchObject({
      status: 'queued',
      runId: 'run2',
    });
  });
});

describe('retries', () => {
  test('errors are retried with an exponential backoff until maxAttempts, then final', async () => {
    const documents = [
      {
        _id: 'a',
        org: 'o1',
        domain: 'acme.test',
        _enrich: { email: { ...queued(), status: 'queued', value: 'previous' } },
      },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });

    const [first] = await claim({ connection });
    const before = Date.now();
    const firstResponse = await complete({
      connection,
      results: [resultOf(first, { status: 'error', error: 'rate limited' })],
    });
    expect(firstResponse).toEqual({
      applied: 1,
      ignored: 0,
      requeued: 1,
      released: 0,
      downstream: [],
    });
    let email = cellOf(await readDocuments(collection), 'a');
    expect(email).toMatchObject({ status: 'queued', error: 'rate limited', value: 'previous' });
    expect(email.queuedAt.getTime() - before).toBeGreaterThanOrEqual(30000);
    expect(email.queuedAt.getTime() - before).toBeLessThan(31000);
    await expect(claim({ connection })).resolves.toEqual([]);

    await makeDue(collection, 'a');
    const [second] = await claim({ connection });
    expect(second.attempt).toBe(2);
    const secondBefore = Date.now();
    await complete({
      connection,
      results: [resultOf(second, { status: 'error', error: 'again' })],
    });
    email = cellOf(await readDocuments(collection), 'a');
    expect(email.queuedAt.getTime() - secondBefore).toBeGreaterThanOrEqual(60000);
    expect(email.queuedAt.getTime() - secondBefore).toBeLessThan(61000);

    await makeDue(collection, 'a');
    const [third] = await claim({ connection });
    expect(third.attempt).toBe(3);
    const thirdResponse = await complete({
      connection,
      results: [resultOf(third, { status: 'error', error: 'gave up' })],
    });
    expect(thirdResponse).toMatchObject({ applied: 1, requeued: 0 });
    email = cellOf(await readDocuments(collection), 'a');
    expect(email).toMatchObject({
      status: 'error',
      error: 'gave up',
      attempts: 3,
      value: 'previous',
      finishedAt: expect.any(Date),
    });
    expect(email.leaseUntil).toBeUndefined();
  });

  test('retry false makes an error final at once', async () => {
    const documents = [{ _id: 'a', org: 'o1', domain: 'acme.test', _enrich: { email: queued() } }];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const [item] = await claim({ connection });
    await complete({
      connection,
      results: [resultOf(item, { status: 'error', error: 'invalid domain', retry: false })],
    });
    expect(cellOf(await readDocuments(collection), 'a')).toMatchObject({
      status: 'error',
      error: 'invalid domain',
    });
  });
});

describe('downstream', () => {
  test('returns the autoRun columns fed by cells that completed ok', async () => {
    const documents = [
      { _id: 'a', org: 'o1', name: 'Acme', domain: 'acme.test', _enrich: { email: queued() } },
      { _id: 'b', org: 'o1', name: 'Bolt', domain: 'bolt.test', _enrich: { email: queued() } },
    ];
    const { connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection });
    const response = await complete({
      connection,
      results: [
        resultOf(claims[0], { value: 'ada@acme.test' }),
        resultOf(claims[1], { status: 'error', error: 'nope' }),
      ],
    });
    expect(response).toEqual({
      applied: 2,
      ignored: 0,
      requeued: 1,
      released: 0,
      downstream: [{ rowKey: claims[0].rowKey, columns: ['pitch'] }],
    });
  });
});

describe('row keys, scope and limits', () => {
  test('completes numeric and ObjectId row keys as the claim returned them', async () => {
    const id = new ObjectId();
    const documents = [
      { _id: 5, org: 'o1', domain: 'five.test', _enrich: { email: queued() } },
      { _id: id, org: 'o1', domain: 'oid.test', _enrich: { email: queued() } },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection });
    const byKey = new Map(claims.map((item) => [JSON.stringify(item.rowKey), item]));
    const response = await complete({
      connection,
      results: [
        resultOf(byKey.get('5'), { rowKey: '5', value: 'five' }),
        resultOf(byKey.get(JSON.stringify({ _oid: id.toHexString() })), { value: 'oid' }),
      ],
    });
    expect(response.applied).toBe(2);
    const docs = await readDocuments(collection);
    expect(cellOf(docs, 5).value).toBe('five');
    expect(cellOf(docs, id).value).toBe('oid');
  });

  test('a result for a row outside the filter or tenant is ignored', async () => {
    const documents = [
      { _id: 'a', org: 'o1', domain: 'acme.test', _enrich: { email: queued() } },
      { _id: 'x', org: 'o2', domain: 'other.test', _enrich: { email: queued() } },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const [other] = await claim({ connection, filter: { org: 'o2' } });
    const scoped = await complete({ connection, results: [resultOf(other, { value: 'leak' })] });
    expect(scoped).toMatchObject({ applied: 0, ignored: 1 });
    const tenant = { field: 'org', value: 'o1' };
    const walled = await complete({
      connection,
      tenant,
      filter: undefined,
      results: [resultOf(other, { value: 'leak' })],
    });
    expect(walled).toMatchObject({ applied: 0, ignored: 1 });
    expect(cellOf(await readDocuments(collection), 'x').value).toBeUndefined();
  });

  test('a large raw is stored as a truncation marker and a large value is an error', async () => {
    const documents = [
      { _id: 'a', org: 'o1', domain: 'a.test', _enrich: { email: queued() } },
      { _id: 'b', org: 'o1', domain: 'b.test', _enrich: { email: queued() } },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection });
    const byKey = new Map(claims.map((item) => [item.rowKey, item]));
    await complete({
      connection,
      rawMaxBytes: 2048,
      results: [
        resultOf(byKey.get('a'), { value: 'ok', raw: { page: 'x'.repeat(10000) } }),
        resultOf(byKey.get('b'), { value: 'y'.repeat(5000) }),
      ],
    });
    const docs = await readDocuments(collection);
    expect(cellOf(docs, 'a')).toMatchObject({
      status: 'ok',
      value: 'ok',
      raw: { _truncated: true, maxBytes: 2048, bytes: expect.any(Number) },
    });
    expect(cellOf(docs, 'a').raw.preview).toHaveLength(1000);
    expect(cellOf(docs, 'b')).toMatchObject({
      status: 'error',
      error: expect.stringMatching(
        /^The result value is \d+ bytes, more than rawMaxBytes \(2048\)\.$/
      ),
    });
  });

  test('an empty results list writes nothing', async () => {
    const { connection } = await setupEnrichmentCollection({
      name,
      documents: [{ _id: 'a', org: 'o1' }],
    });
    await expect(complete({ connection, results: [] })).resolves.toEqual({
      applied: 0,
      ignored: 0,
      requeued: 0,
      released: 0,
      downstream: [],
    });
  });

  test('writes a change log record of the applied results', async () => {
    const documents = [{ _id: 'a', org: 'o1', domain: 'a.test', _enrich: { email: queued() } }];
    const { connection, logCollection } = await setupEnrichmentCollection({
      name,
      documents,
      changeLog: true,
    });
    const [item] = await claim({ connection });
    const before = await readDocuments(logCollection);
    await complete({ connection, results: [resultOf(item, { value: 'v', raw: { big: 1 } })] });
    const records = (await readDocuments(logCollection)).slice(before.length);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      type: 'MongoDBEnrichmentComplete',
      requestId: 'complete_request',
      args: {
        results: [
          {
            rowKey: 'a',
            columnKey: 'email',
            claimToken: item.claimToken,
            status: 'ok',
            value: 'v',
          },
        ],
      },
      response: { applied: 1 },
    });
    expect(records[0].args.results[0].raw).toBeUndefined();
  });
});
