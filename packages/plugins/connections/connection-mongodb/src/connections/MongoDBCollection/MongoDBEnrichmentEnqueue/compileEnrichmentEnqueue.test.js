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
import { validate } from '@lowdefy/ajv';

import hashEnrichmentInputs from '../enrichment/hashEnrichmentInputs.js';
import compileEnrichmentEnqueue from './compileEnrichmentEnqueue.js';
import planEnqueueCell from './planEnqueueCell.js';
import schema from './schema.js';

const now = new Date('2026-09-29T10:00:00.000Z');

const fields = {
  name: { type: 'text', search: true },
  domain: { type: 'url' },
  size: { type: 'number' },
};

const columnDefs = [
  { key: 'name' },
  { key: 'domain' },
  { key: 'size' },
  {
    key: 'email',
    kind: 'enrichment',
    provider: 'finder',
    inputs: { domain: { column: 'domain' } },
  },
  {
    key: 'pitch',
    kind: 'ai',
    prompt: 'Write a pitch for {{ name }}',
    inputs: { name: { column: 'name' }, email: { column: 'email' }, tone: { value: 'warm' } },
  },
];

function compile(properties, { tenantScoped = false } = {}) {
  return compileEnrichmentEnqueue({
    properties: { fields, columnDefs, columns: ['email'], filter: { org: 'o1' }, ...properties },
    tenantScoped,
    now,
    generate: () => 'run_generated',
  });
}

const liveCondition = {
  $or: [
    { '_enrich.email.status': 'queued' },
    { '_enrich.email.status': 'running', '_enrich.email.leaseUntil': { $gte: now } },
  ],
};

describe('compileEnrichmentEnqueue', () => {
  test('compiles the default mode "all" to every cell that is not live', () => {
    const compiled = compile({});
    expect(compiled.mode).toBe('all');
    expect(compiled.runId).toBe('run_generated');
    expect(compiled.maxCells).toBe(10000);
    expect(compiled.scope).toEqual({ org: 'o1' });
    expect(compiled.targets).toEqual([
      {
        columnKey: 'email',
        inputHashPath: '_enrich.email.inputHash',
        sources: [
          { param: 'domain', source: 'field', column: 'domain', required: true, path: 'domain' },
        ],
        condition: { $nor: [liveCondition] },
        projection: { _id: 1, '_enrich.email.inputHash': 1, domain: 1 },
      },
    ]);
  });

  test('compiles each mode to its cells', () => {
    expect(compile({ mode: 'empty' }).targets[0].condition).toEqual({
      '_enrich.email.status': { $in: [null, 'empty'] },
    });
    expect(compile({ mode: 'errors' }).targets[0].condition).toEqual({
      '_enrich.email.status': 'error',
    });
    expect(compile({ mode: 'stale' }).targets[0].condition).toEqual({
      $and: [{ $nor: [liveCondition] }, { '_enrich.email.inputHash': { $exists: true } }],
    });
  });

  test('an ai column with an enrichment input reads its status and value', () => {
    const [target] = compile({ columns: ['pitch'] }).targets;
    expect(target.projection).toEqual({
      _id: 1,
      '_enrich.email.status': 1,
      '_enrich.email.value': 1,
      '_enrich.pitch.inputHash': 1,
      name: 1,
    });
  });

  test('a key selection narrows the base filter to the keys in both numeric forms', () => {
    expect(compile({ selection: [5, 'a', '{"_oid":"64b7f0c2a1b2c3d4e5f60718"}'] }).scope).toEqual({
      $and: [
        { org: 'o1' },
        {
          _id: {
            $in: [5, '5', 'a', ObjectId.createFromHexString('64b7f0c2a1b2c3d4e5f60718')],
          },
        },
      ],
    });
  });

  test('a select-all selection compiles its filter and search with MongoDBTableQuery', () => {
    expect(
      compile({
        selection: {
          all: true,
          except: ['x'],
          filter: { key: 'size', op: 'gt', value: 10 },
          search: 'acme',
        },
        rowKeyField: 'id',
      }).scope
    ).toEqual({
      $and: [{ org: 'o1' }, { size: { $gt: 10 } }, { name: /acme/i }, { id: { $nin: ['x'] } }],
    });
  });

  test('a select-all selection filter is validated against fields', () => {
    expect(() =>
      compile({ selection: { all: true, filter: { key: 'secret', op: 'eq', value: 1 } } })
    ).toThrow();
  });

  test('refuses more selected keys than maxCells', () => {
    expect(() => compile({ selection: ['a', 'b', 'c'], maxCells: 2 })).toThrow(
      'MongoDBEnrichmentEnqueue "selection" has 3 row keys, more than "maxCells" (2).'
    );
    expect(() => compile({ selection: [] })).toThrow(
      'MongoDBEnrichmentEnqueue "selection" is empty'
    );
    expect(() => compile({ selection: { all: false } })).toThrow(
      'MongoDBEnrichmentEnqueue "selection" should be an array of row keys'
    );
    expect(() => compile({ selection: [{ $ne: null }] })).toThrow(
      'MongoDBEnrichmentEnqueue "selection" has an invalid row key'
    );
  });

  test('keeps a valid runId and refuses an invalid one', () => {
    expect(compile({ runId: 'run-2026_09' }).runId).toBe('run-2026_09');
    expect(() => compile({ runId: 'a.b' })).toThrow('"runId" should be 1 to 64 letters');
  });

  test('refuses an unknown mode and limits out of range', () => {
    expect(() => compile({ mode: 'failed' })).toThrow(
      'MongoDBEnrichmentEnqueue "mode" should be one of ["all","empty","errors","stale"].'
    );
    expect(() => compile({ maxCells: 0 })).toThrow(
      '"maxCells" should be an integer from 1 to 1000000'
    );
    expect(() => compile({ maxTimeMS: 1.5 })).toThrow('"maxTimeMS" should be an integer');
  });

  test('refuses a request without fields, columns or a scoping filter', () => {
    expect(() => compile({ fields: undefined })).toThrow(
      'MongoDBEnrichmentEnqueue requires "fields"'
    );
    expect(() => compile({ columns: undefined })).toThrow(
      'MongoDBEnrichmentEnqueue requires "columns"'
    );
    expect(() => compile({ columns: ['name'] })).toThrow('not an enrichment or ai column');
    expect(() => compile({ filter: undefined })).toThrow(
      'MongoDBEnrichmentEnqueue requires a "filter"'
    );
    expect(compile({ filter: undefined }, { tenantScoped: true }).scope).toEqual({});
  });

  test('refuses an input column that is not in fields', () => {
    expect(() => compile({ fields: { name: { type: 'text' } } })).toThrow(
      'input "domain" reads column "domain", which is neither an enrichment column'
    );
  });

  test('refuses an unsafe rowKeyField and rowKeyType', () => {
    expect(() => compile({ rowKeyField: '$where' })).toThrow('"rowKeyField" should be a dot path');
    expect(() => compile({ rowKeyType: 'uuid' })).toThrow('"rowKeyType" should be one of');
  });
});

describe('planEnqueueCell', () => {
  const _id = new ObjectId();

  test('queues a cell whose inputs are ready and keeps its previous result', () => {
    const compiled = compile({});
    expect(
      planEnqueueCell({ doc: { _id, domain: 'acme.test' }, target: compiled.targets[0], compiled })
    ).toEqual({
      kind: 'queue',
      operation: {
        updateOne: {
          filter: { $and: [{ org: 'o1' }, { _id }, { $nor: [liveCondition] }] },
          update: {
            $set: {
              '_enrich.email.status': 'queued',
              '_enrich.email.runId': 'run_generated',
              '_enrich.email.queuedAt': now,
              '_enrich.email.attempts': 0,
            },
            $unset: {
              '_enrich.email.error': '',
              '_enrich.email.claimToken': '',
              '_enrich.email.leaseUntil': '',
              '_enrich.email.startedAt': '',
            },
          },
        },
      },
    });
  });

  test('sets a cell with a missing input to empty with the column named', () => {
    const compiled = compile({ mode: 'empty' });
    const cell = planEnqueueCell({
      doc: { _id, domain: '' },
      target: compiled.targets[0],
      compiled,
    });
    expect(cell.kind).toBe('missing');
    expect(cell.operation.updateOne.update).toEqual({
      $set: {
        '_enrich.email.status': 'empty',
        '_enrich.email.error': 'Missing input: domain',
        '_enrich.email.runId': 'run_generated',
        '_enrich.email.attempts': 0,
        '_enrich.email.finishedAt': now,
      },
      $unset: {
        '_enrich.email.value': '',
        '_enrich.email.raw': '',
        '_enrich.email.inputHash': '',
        '_enrich.email.claimToken': '',
        '_enrich.email.leaseUntil': '',
        '_enrich.email.queuedAt': '',
        '_enrich.email.startedAt': '',
      },
    });
  });

  test('stale mode skips a cell computed from the current inputs', () => {
    const compiled = compile({ mode: 'stale' });
    const inputHash = hashEnrichmentInputs({ domain: 'acme.test' });
    expect(
      planEnqueueCell({
        doc: { _id, domain: 'acme.test', _enrich: { email: { inputHash } } },
        target: compiled.targets[0],
        compiled,
      })
    ).toEqual({ kind: 'skip' });
  });

  test('stale mode queues a changed cell only while it still has the hash it was read with', () => {
    const compiled = compile({ mode: 'stale' });
    const cell = planEnqueueCell({
      doc: { _id, domain: 'new.test', _enrich: { email: { inputHash: 'old' } } },
      target: compiled.targets[0],
      compiled,
    });
    expect(cell.kind).toBe('queue');
    expect(cell.operation.updateOne.filter.$and).toContainEqual({
      '_enrich.email.inputHash': 'old',
    });
  });

  test('queues a cell whose enrichment input is still running', () => {
    const compiled = compile({ columns: ['pitch'] });
    const cell = planEnqueueCell({
      doc: { _id, name: 'Acme', _enrich: { email: { status: 'running' } } },
      target: compiled.targets[0],
      compiled,
    });
    expect(cell.kind).toBe('queue');
  });
});

test('the schema accepts a full request and refuses one without columns', () => {
  expect(
    validate({
      schema,
      data: {
        columns: ['email'],
        columnDefs,
        fields,
        selection: { all: true, except: ['a'] },
        mode: 'stale',
        filter: {},
        rowKeyField: '_id',
        rowKeyType: 'auto',
        maxCells: 100,
        maxTimeMS: 1000,
        runId: 'r1',
        user: { id: 'u' },
        timezone: 'UTC',
      },
    })
  ).toEqual({ valid: true });
  expect(() => validate({ schema, data: { columnDefs, fields } })).toThrow(
    'MongoDBEnrichmentEnqueue request should have required property "columns".'
  );
  expect(() =>
    validate({ schema, data: { columns: ['email'], columnDefs, fields, mode: 'x' } })
  ).toThrow(
    'MongoDBEnrichmentEnqueue request property "mode" should be "all", "empty", "errors" or "stale".'
  );
});
