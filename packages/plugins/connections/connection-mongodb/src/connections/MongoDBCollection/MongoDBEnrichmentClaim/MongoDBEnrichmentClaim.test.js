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

import MongoDBEnrichmentClaim from './MongoDBEnrichmentClaim.js';
import hashEnrichmentInputs from '../enrichment/hashEnrichmentInputs.js';
import {
  columnDefs,
  fields,
  readDocuments,
  setupEnrichmentCollection,
  updateDocuments,
} from '../../../../test/enrichmentTable.js';

const name = 'enrichmentClaim';
const { checkRead, checkWrite } = MongoDBEnrichmentClaim.meta;

const minute = 60000;

function queued({ minutesAgo = 1, attempts = 0, runId = 'run1' } = {}) {
  return {
    status: 'queued',
    runId,
    attempts,
    queuedAt: new Date(Date.now() - minutesAgo * minute),
  };
}

function claim({ connection, tenant, tenantGuard, ...properties }) {
  return MongoDBEnrichmentClaim({
    request: { fields, columnDefs, filter: { org: 'o1' }, ...properties },
    connection,
    tenant,
    tenantGuard,
    requestId: 'claim_request',
  });
}

function cellOf(docs, _id, columnKey = 'email') {
  return docs.find((doc) => String(doc._id) === String(_id))?._enrich?.[columnKey];
}

test('checkRead and checkWrite should be true', () => {
  expect(checkRead).toBe(true);
  expect(checkWrite).toBe(true);
});

describe('claiming', () => {
  test('claims the oldest due cells up to the limit, with a lease and a claim token', async () => {
    const documents = [
      {
        _id: 'new',
        org: 'o1',
        name: 'New',
        domain: 'new.test',
        secret: 's',
        _enrich: { email: queued({ minutesAgo: 1 }) },
      },
      {
        _id: 'old',
        org: 'o1',
        name: 'Old',
        domain: 'old.test',
        _enrich: { email: queued({ minutesAgo: 5 }) },
      },
      {
        _id: 'mid',
        org: 'o1',
        name: 'Mid',
        domain: 'mid.test',
        _enrich: { email: queued({ minutesAgo: 3 }) },
      },
      {
        _id: 'later',
        org: 'o1',
        domain: 'later.test',
        _enrich: { email: { ...queued(), queuedAt: new Date(Date.now() + minute) } },
      },
      { _id: 'other', org: 'o2', domain: 'o.test', _enrich: { email: queued({ minutesAgo: 9 }) } },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const before = Date.now();
    const claims = await claim({ connection, limit: 2, columns: ['email'] });
    expect(claims.map((item) => item.rowKey)).toEqual(['old', 'mid']);
    const inputHash = hashEnrichmentInputs({ domain: 'old.test' });
    expect(claims[0]).toEqual({
      rowKey: 'old',
      columnKey: 'email',
      provider: 'finder',
      runId: 'run1',
      claimToken: expect.stringMatching(new RegExp(`^[0-9a-f]{24}:${inputHash}$`)),
      attempt: 1,
      inputHash,
      inputs: { domain: 'old.test' },
      row: { _id: 'old', name: 'Old', domain: 'old.test' },
    });
    const docs = await readDocuments(collection);
    const claimed = cellOf(docs, 'old');
    expect(claimed).toMatchObject({
      status: 'running',
      attempts: 1,
      claimToken: claims[0].claimToken,
      runId: 'run1',
    });
    expect(claimed.startedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(claimed.leaseUntil.getTime() - claimed.startedAt.getTime()).toBe(120000);
    expect(cellOf(docs, 'new').status).toBe('queued');
    expect(cellOf(docs, 'later').status).toBe('queued');
    expect(cellOf(docs, 'other').status).toBe('queued');
  });

  test('never returns a field outside fields in the row', async () => {
    const documents = [
      { _id: 'a', org: 'o1', domain: 'a.test', password: 'p', _enrich: { email: queued() } },
    ];
    const { connection } = await setupEnrichmentCollection({ name, documents });
    const [item] = await claim({ connection });
    expect(item.row).toEqual({ _id: 'a', domain: 'a.test' });
  });

  test('returns an empty list when nothing is due', async () => {
    const { connection } = await setupEnrichmentCollection({
      name,
      documents: [{ _id: 'a', org: 'o1', domain: 'a.test' }],
    });
    await expect(claim({ connection })).resolves.toEqual([]);
  });

  test('claims across columns, and an ai claim has the resolved enrichment input and prompt', async () => {
    const documents = [
      {
        _id: 'a',
        org: 'o1',
        name: 'Acme',
        domain: 'acme.test',
        _enrich: {
          email: { status: 'ok', value: 'ada@acme.test' },
          pitch: queued({ minutesAgo: 2 }),
        },
      },
      { _id: 'b', org: 'o1', domain: 'b.test', _enrich: { email: queued({ minutesAgo: 1 }) } },
    ];
    const { connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection });
    expect(claims.map((item) => [item.rowKey, item.columnKey])).toEqual([
      ['a', 'pitch'],
      ['b', 'email'],
    ]);
    expect(claims[0]).toMatchObject({
      provider: 'ai',
      prompt: 'Write a pitch for {{ name }} to {{ email }}',
      inputs: { name: 'Acme', email: 'ada@acme.test' },
    });
    expect(claims[0].row).toEqual({
      _id: 'a',
      name: 'Acme',
      domain: 'acme.test',
      _enrich: { email: { value: 'ada@acme.test' } },
    });
  });

  test('providers restricts a claim to the columns of those providers', async () => {
    const documents = [
      {
        _id: 'a',
        org: 'o1',
        name: 'Acme',
        _enrich: { email: { status: 'ok', value: 'e' }, pitch: queued() },
      },
      { _id: 'b', org: 'o1', domain: 'b.test', _enrich: { email: queued() } },
    ];
    const { connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection, providers: ['finder'] });
    expect(claims.map((item) => item.columnKey)).toEqual(['email']);
    await expect(claim({ connection, providers: ['none'] })).resolves.toEqual([]);
  });

  test('numeric and ObjectId row keys are returned as the row holds them', async () => {
    const id = new ObjectId();
    const documents = [
      { _id: 5, org: 'o1', domain: 'five.test', _enrich: { email: queued({ minutesAgo: 2 }) } },
      { _id: id, org: 'o1', domain: 'oid.test', _enrich: { email: queued({ minutesAgo: 1 }) } },
    ];
    const { connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection });
    expect(claims.map((item) => item.rowKey)).toEqual([5, { _oid: id.toHexString() }]);
    expect(claims[1].row._id).toEqual({ _oid: id.toHexString() });
  });
});

describe('concurrent workers', () => {
  test('parallel claims never claim the same cell twice', async () => {
    const documents = Array.from({ length: 60 }, (_, index) => ({
      _id: `r${String(index).padStart(2, '0')}`,
      org: 'o1',
      domain: `d${index}.test`,
      _enrich: { email: queued({ minutesAgo: 60 - index }) },
    }));
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const results = await Promise.all(
      Array.from({ length: 6 }, () => claim({ connection, limit: 20 }))
    );
    const leftover = await claim({ connection, limit: 200 });
    const all = [...results.flat(), ...leftover];
    const cells = all.map((item) => `${item.rowKey}|${item.columnKey}`);
    expect(new Set(cells).size).toBe(cells.length);
    expect(cells).toHaveLength(60);
    expect(results.filter((items) => items.length > 0).length).toBeGreaterThan(1);
    const docs = await readDocuments(collection);
    const tokens = new Map(all.map((item) => [item.rowKey, item.claimToken]));
    docs.forEach((doc) => {
      expect(doc._enrich.email).toMatchObject({
        status: 'running',
        attempts: 1,
        claimToken: tokens.get(doc._id),
      });
    });
  });

  test('parallel claims of a few cells return each cell to exactly one worker, round after round', async () => {
    const documents = Array.from({ length: 5 }, (_, index) => ({
      _id: `r${index}`,
      org: 'o1',
      domain: `d${index}.test`,
      _enrich: { email: queued() },
    }));
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    for (let round = 0; round < 5; round += 1) {
      const results = await Promise.all(Array.from({ length: 8 }, () => claim({ connection })));
      const cells = results.flat().map((item) => item.rowKey);
      expect(cells.sort()).toEqual(['r0', 'r1', 'r2', 'r3', 'r4']);
      await updateDocuments(
        collection,
        {},
        {
          $set: {
            '_enrich.email.status': 'queued',
            '_enrich.email.queuedAt': new Date(Date.now() - minute),
          },
        }
      );
    }
  });
});

describe('leases', () => {
  test('a running cell whose lease ran out is claimed again as the next attempt', async () => {
    const documents = [{ _id: 'a', org: 'o1', domain: 'a.test', _enrich: { email: queued() } }];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const [first] = await claim({ connection, leaseMs: 1000 });
    await expect(claim({ connection })).resolves.toEqual([]);
    await updateDocuments(
      collection,
      { _id: 'a' },
      { $set: { '_enrich.email.leaseUntil': new Date(Date.now() - 1) } }
    );
    const [second] = await claim({ connection });
    expect(second.attempt).toBe(2);
    expect(second.claimToken).not.toBe(first.claimToken);
    expect(cellOf(await readDocuments(collection), 'a')).toMatchObject({
      status: 'running',
      attempts: 2,
      claimToken: second.claimToken,
    });
  });

  test('a lease that ran out on the last attempt makes the cell an error', async () => {
    const documents = [
      {
        _id: 'a',
        org: 'o1',
        domain: 'a.test',
        _enrich: {
          email: {
            status: 'running',
            attempts: 3,
            claimToken: 'x',
            value: 'kept',
            leaseUntil: new Date(Date.now() - minute),
          },
        },
      },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    await expect(claim({ connection })).resolves.toEqual([]);
    expect(cellOf(await readDocuments(collection), 'a')).toEqual({
      status: 'error',
      attempts: 3,
      value: 'kept',
      error: "The worker's lease ran out on attempt 3 of 3.",
      finishedAt: expect.any(Date),
    });
  });
});

describe('inputs at claim time', () => {
  test('a cell whose input is gone is set to empty, and the claim moves on', async () => {
    const documents = [
      { _id: 'a', org: 'o1', domain: null, _enrich: { email: queued({ minutesAgo: 5 }) } },
      { _id: 'b', org: 'o1', domain: 'b.test', _enrich: { email: queued({ minutesAgo: 1 }) } },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection, limit: 1 });
    expect(claims.map((item) => item.rowKey)).toEqual(['b']);
    expect(cellOf(await readDocuments(collection), 'a')).toMatchObject({
      status: 'empty',
      error: 'Missing input: domain',
    });
  });

  test('a cell whose enrichment input is still running is deferred', async () => {
    const documents = [
      {
        _id: 'a',
        org: 'o1',
        name: 'Acme',
        _enrich: {
          email: { status: 'running', leaseUntil: new Date(Date.now() + minute) },
          pitch: queued(),
        },
      },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    await expect(claim({ connection, columns: ['pitch'] })).resolves.toEqual([]);
    const pitch = cellOf(await readDocuments(collection), 'a', 'pitch');
    expect(pitch.status).toBe('queued');
    expect(pitch.queuedAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('tenant scoping and change log', () => {
  const tenant = { field: 'org', value: 'o1' };

  test('a tenant connection claims only the tenant rows', async () => {
    const documents = [
      { _id: 'a', org: 'o1', domain: 'a.test', _enrich: { email: queued({ minutesAgo: 1 }) } },
      { _id: 'x', org: 'o2', domain: 'x.test', _enrich: { email: queued({ minutesAgo: 9 }) } },
    ];
    const { collection, connection } = await setupEnrichmentCollection({ name, documents });
    const claims = await claim({ connection, tenant, filter: undefined });
    expect(claims.map((item) => item.rowKey)).toEqual(['a']);
    expect(cellOf(await readDocuments(collection), 'x').status).toBe('queued');
  });

  test('writes a change log record when cells were claimed', async () => {
    const documents = [{ _id: 'a', org: 'o1', domain: 'a.test', _enrich: { email: queued() } }];
    const { connection, logCollection } = await setupEnrichmentCollection({
      name,
      documents,
      changeLog: true,
    });
    await expect(claim({ connection, columns: ['pitch'] })).resolves.toEqual([]);
    expect(await readDocuments(logCollection)).toEqual([]);
    const [item] = await claim({ connection, tenant, filter: undefined });
    const records = await readDocuments(logCollection);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      type: 'MongoDBEnrichmentClaim',
      org: 'o1',
      args: { claimed: [{ rowKey: 'a', columnKey: 'email', claimToken: item.claimToken }] },
      response: { claimed: 1, written: 1 },
    });
  });
});
