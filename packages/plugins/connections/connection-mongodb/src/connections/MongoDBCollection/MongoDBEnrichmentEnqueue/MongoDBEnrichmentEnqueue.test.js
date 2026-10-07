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

import MongoDBEnrichmentEnqueue from './MongoDBEnrichmentEnqueue.js';
import hashEnrichmentInputs from '../enrichment/hashEnrichmentInputs.js';
import {
  columnDefs,
  fields,
  readDocuments,
  setupEnrichmentCollection,
} from '../../../../test/enrichmentTable.js';

const name = 'enrichmentEnqueue';
const { checkRead, checkWrite } = MongoDBEnrichmentEnqueue.meta;

const hour = 3600000;

function leads() {
  return [
    { _id: 'a', org: 'o1', name: 'Acme', domain: 'acme.test', size: 50 },
    { _id: 'b', org: 'o1', name: 'Bolt', domain: 'bolt.test', size: 5 },
    { _id: 'c', org: 'o1', name: 'Crate', domain: '' },
    { _id: 'x', org: 'o2', name: 'Other org', domain: 'other.test' },
  ];
}

function enqueue({ connection, tenant, tenantGuard, ...properties }) {
  return MongoDBEnrichmentEnqueue({
    request: { fields, columnDefs, columns: ['email'], filter: { org: 'o1' }, ...properties },
    connection,
    tenant,
    tenantGuard,
    requestId: 'enqueue_request',
  });
}

function cell(docs, _id, columnKey = 'email') {
  return docs.find((doc) => doc._id === _id)?._enrich?.[columnKey];
}

test('checkRead should be false and checkWrite true', () => {
  expect(checkRead).toBe(false);
  expect(checkWrite).toBe(true);
});

describe('mode all', () => {
  test('queues every cell inside the filter and sets missing inputs to empty', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
    });
    const response = await enqueue({ connection, runId: 'run1' });
    expect(response).toEqual({ queued: 2, skipped: 0, missingInputs: 1, runId: 'run1' });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'a')).toEqual({
      status: 'queued',
      runId: 'run1',
      queuedAt: expect.any(Date),
      attempts: 0,
    });
    expect(cell(docs, 'c')).toEqual({
      status: 'empty',
      error: 'Missing input: domain',
      runId: 'run1',
      attempts: 0,
      finishedAt: expect.any(Date),
    });
    expect(cell(docs, 'x')).toBeUndefined();
  });

  test('generates a runId when none is given', async () => {
    const { connection } = await setupEnrichmentCollection({ name, documents: leads() });
    const response = await enqueue({ connection });
    expect(response.runId).toMatch(/^[0-9a-f]{24}$/);
  });

  test('never touches live cells, and re-queues a running cell whose lease ran out', async () => {
    const now = Date.now();
    const documents = leads();
    documents[0]._enrich = { email: { status: 'queued', runId: 'old', queuedAt: new Date(now) } };
    documents[1]._enrich = {
      email: {
        status: 'running',
        runId: 'old',
        claimToken: 'live',
        leaseUntil: new Date(now + hour),
      },
    };
    documents.push({
      _id: 'd',
      org: 'o1',
      name: 'Dune',
      domain: 'dune.test',
      _enrich: {
        email: {
          status: 'running',
          runId: 'old',
          claimToken: 'expired',
          attempts: 1,
          leaseUntil: new Date(now - hour),
        },
      },
    });
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const response = await enqueue({ connection, runId: 'run2' });
    expect(response).toEqual({ queued: 1, skipped: 2, missingInputs: 1, runId: 'run2' });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'a').runId).toBe('old');
    expect(cell(docs, 'b')).toMatchObject({ status: 'running', claimToken: 'live' });
    expect(cell(docs, 'd')).toEqual({
      status: 'queued',
      runId: 'run2',
      attempts: 0,
      queuedAt: expect.any(Date),
    });
  });

  test('keeps the previous value, raw and inputHash while the cell re-runs', async () => {
    const documents = leads();
    documents[0]._enrich = {
      email: { status: 'ok', value: 'old@acme.test', raw: { hits: 1 }, inputHash: 'h1' },
    };
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    await enqueue({ connection, selection: ['a'], runId: 'run3' });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'a')).toEqual({
      status: 'queued',
      value: 'old@acme.test',
      raw: { hits: 1 },
      inputHash: 'h1',
      runId: 'run3',
      attempts: 0,
      queuedAt: expect.any(Date),
    });
  });

  test('writes only the _enrich cell of the column', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
    });
    const before = await readDocuments(collection);
    await enqueue({ connection });
    const after = await readDocuments(collection);
    after.forEach((doc, index) => {
      const { _enrich, ...rest } = doc;
      expect(rest).toEqual(before[index]);
      expect(Object.keys(_enrich ?? {}).every((key) => key === 'email')).toBe(true);
    });
  });
});

describe('modes', () => {
  function documentsWithStates() {
    return [
      { _id: 'never', org: 'o1', name: 'N', domain: 'n.test' },
      {
        _id: 'empty',
        org: 'o1',
        name: 'E',
        domain: 'e.test',
        _enrich: { email: { status: 'empty' } },
      },
      {
        _id: 'error',
        org: 'o1',
        name: 'R',
        domain: 'r.test',
        _enrich: { email: { status: 'error', error: 'boom', attempts: 3 } },
      },
      {
        _id: 'fresh',
        org: 'o1',
        name: 'F',
        domain: 'f.test',
        _enrich: {
          email: {
            status: 'ok',
            value: 'f@f.test',
            inputHash: hashEnrichmentInputs({ domain: 'f.test' }),
          },
        },
      },
      {
        _id: 'stale',
        org: 'o1',
        name: 'S',
        domain: 'new.test',
        _enrich: {
          email: {
            status: 'ok',
            value: 's@old.test',
            inputHash: hashEnrichmentInputs({ domain: 'old.test' }),
          },
        },
      },
      {
        _id: 'staleMissing',
        org: 'o1',
        name: 'M',
        domain: null,
        _enrich: { email: { status: 'ok', value: 'm@old.test', inputHash: 'x' } },
      },
    ];
  }

  test('empty queues cells never run or with no result', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: documentsWithStates(),
    });
    const response = await enqueue({ connection, mode: 'empty' });
    expect(response).toMatchObject({ queued: 2, missingInputs: 0, skipped: 4 });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'never').status).toBe('queued');
    expect(cell(docs, 'empty').status).toBe('queued');
    expect(cell(docs, 'error').status).toBe('error');
  });

  test('errors queues failed cells with their attempts reset and the error cleared', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: documentsWithStates(),
    });
    const response = await enqueue({ connection, mode: 'errors' });
    expect(response).toMatchObject({ queued: 1, missingInputs: 0, skipped: 5 });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'error')).toEqual({
      status: 'queued',
      attempts: 0,
      runId: response.runId,
      queuedAt: expect.any(Date),
    });
  });

  test('stale queues cells whose inputs changed since their value was computed', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: documentsWithStates(),
    });
    const response = await enqueue({ connection, mode: 'stale' });
    expect(response).toMatchObject({ queued: 1, missingInputs: 1, skipped: 4 });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'fresh').status).toBe('ok');
    expect(cell(docs, 'stale')).toMatchObject({ status: 'queued', value: 's@old.test' });
    expect(cell(docs, 'staleMissing')).toMatchObject({
      status: 'empty',
      error: 'Missing input: domain',
    });
    expect(cell(docs, 'never')).toBeUndefined();
  });

  test('stale compares the inputs of an ai column, enrichment inputs included', async () => {
    const pitchHash = hashEnrichmentInputs({ name: 'Acme', email: 'ada@acme.test' });
    const documents = [
      {
        _id: 'same',
        org: 'o1',
        name: 'Acme',
        _enrich: {
          email: { status: 'ok', value: 'ada@acme.test' },
          pitch: { status: 'ok', value: 'Hi', inputHash: pitchHash },
        },
      },
      {
        _id: 'changed',
        org: 'o1',
        name: 'Acme',
        _enrich: {
          email: { status: 'ok', value: 'grace@acme.test' },
          pitch: { status: 'ok', value: 'Hi', inputHash: pitchHash },
        },
      },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const response = await enqueue({ connection, columns: ['pitch'], mode: 'stale' });
    expect(response).toMatchObject({ queued: 1, skipped: 1 });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'changed', 'pitch').status).toBe('queued');
    expect(cell(docs, 'same', 'pitch').status).toBe('ok');
  });
});

describe('selection', () => {
  test('a key list enqueues those rows, matching numeric keys in both forms', async () => {
    const id = new ObjectId();
    const documents = [
      { _id: 5, org: 'o1', domain: 'five.test' },
      { _id: '6', org: 'o1', domain: 'six.test' },
      { _id: 7, org: 'o1', domain: 'seven.test' },
      { _id: id, org: 'o1', domain: 'oid.test' },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const response = await enqueue({
      connection,
      selection: ['5', 6, { _oid: id.toHexString() }],
    });
    expect(response).toMatchObject({ queued: 3, skipped: 0 });
    const docs = await readDocuments(collection);
    expect(docs.filter((doc) => doc._enrich?.email?.status === 'queued')).toHaveLength(3);
    expect(docs.find((doc) => doc._id === 7)._enrich).toBeUndefined();
  });

  test('a select-all selection enqueues the rows matching the view but the excepted keys', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
    });
    const response = await enqueue({
      connection,
      selection: { all: true, except: ['b'], filter: { key: 'size', op: 'gte', value: 1 } },
    });
    expect(response).toMatchObject({ queued: 1, skipped: 0, missingInputs: 0 });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'a').status).toBe('queued');
    expect(cell(docs, 'b')).toBeUndefined();
    expect(cell(docs, 'c')).toBeUndefined();
  });

  test('a select-all search only reaches rows inside the base filter', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
    });
    await enqueue({ connection, selection: { all: true, search: 'other' } });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'x')).toBeUndefined();
  });

  test('a custom rowKeyField selects by that field', async () => {
    const documents = leads().map((doc, index) => ({ ...doc, ref: `L-${index}` }));
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const response = await enqueue({ connection, selection: ['L-1'], rowKeyField: 'ref' });
    expect(response.queued).toBe(1);
    expect(cell(await readDocuments(collection), 'b').status).toBe('queued');
  });
});

describe('limits', () => {
  test('writes nothing when more than maxCells cells would be written', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
    });
    await expect(enqueue({ connection, maxCells: 2 })).rejects.toThrow(
      'MongoDBEnrichmentEnqueue would write more than "maxCells" (2) cells.'
    );
    const docs = await readDocuments(collection);
    expect(docs.every((doc) => doc._enrich === undefined)).toBe(true);
  });

  test('queues more than one bulkWrite batch of cells in one request', async () => {
    const documents = Array.from({ length: 2500 }, (_, index) => ({
      _id: index,
      org: 'o1',
      domain: `d${index}.test`,
    }));
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const response = await enqueue({ connection });
    expect(response).toMatchObject({ queued: 2500, skipped: 0, missingInputs: 0 });
    const docs = await readDocuments(collection);
    expect(docs.every((doc) => doc._enrich.email.status === 'queued')).toBe(true);
  }, 60000);

  test('runs several columns in one request', async () => {
    const documents = [
      {
        _id: 'a',
        org: 'o1',
        name: 'Acme',
        domain: 'acme.test',
        _enrich: { email: { status: 'ok', value: 'ada@acme.test' } },
      },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const response = await enqueue({ connection, columns: ['email', 'pitch'] });
    expect(response).toMatchObject({ queued: 2, skipped: 0 });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'a', 'pitch').status).toBe('queued');
  });
});

describe('tenant scoping and change log', () => {
  const tenant = { field: 'org', value: 'o1' };

  test('a tenant connection enqueues only the tenant rows, without a filter', async () => {
    const { collection, connection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
    });
    const response = await enqueue({ connection, tenant, filter: undefined });
    expect(response).toMatchObject({ queued: 2, missingInputs: 1 });
    const docs = await readDocuments(collection);
    expect(cell(docs, 'x')).toBeUndefined();
  });

  test('a tenant connection refuses a filter on the tenant field', async () => {
    const { connection } = await setupEnrichmentCollection({ name, documents: leads() });
    await expect(enqueue({ connection, tenant, filter: { org: 'o2' } })).rejects.toThrow(
      'Tenant field "org" can not be set in a filter on a tenant connection'
    );
  });

  test('a filter naming _enrich is refused', async () => {
    const { connection } = await setupEnrichmentCollection({ name, documents: leads() });
    await expect(
      enqueue({ connection, filter: { org: 'o1', '_enrich.email.status': 'ok' } })
    ).rejects.toThrow('"filter" matches "_enrich.email.status"');
  });

  test('writes one change log record, stamped with the tenant', async () => {
    const { connection, logCollection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
      changeLog: true,
    });
    const response = await enqueue({ connection, tenant, filter: undefined, runId: 'logged' });
    const records = await readDocuments(logCollection);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      type: 'MongoDBEnrichmentEnqueue',
      requestId: 'enqueue_request',
      org: 'o1',
      args: { columns: ['email'], mode: 'all', runId: 'logged' },
      response,
    });
  });

  test('a tenant: none request on a change-logged tenant connection is refused and logs nothing', async () => {
    const { collection, connection, logCollection } = await setupEnrichmentCollection({
      name,
      documents: leads(),
      changeLog: true,
    });
    const before = await readDocuments(collection);
    await expect(
      enqueue({ connection, tenantGuard: { field: 'org', readOnly: true } })
    ).rejects.toThrow(
      'MongoDBEnrichmentEnqueue writes, and a request with tenant: none may only read'
    );
    expect(await readDocuments(collection)).toEqual(before);
    expect(await readDocuments(logCollection)).toEqual([]);
  });
});
