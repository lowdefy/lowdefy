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

import compileEnrichmentComplete from './compileEnrichmentComplete.js';
import getDownstream from './getDownstream.js';
import limitRaw from './limitRaw.js';
import planCompleteCell from './planCompleteCell.js';
import schema from './schema.js';

const now = new Date('2026-09-29T10:00:00.000Z');
const token = `${'b'.repeat(24)}:${'0123456789abcd'}`;

const columnDefs = [
  { key: 'domain' },
  {
    key: 'email',
    kind: 'enrichment',
    provider: 'finder',
    inputs: { domain: { column: 'domain' } },
  },
  {
    key: 'pitch',
    kind: 'ai',
    autoRun: true,
    inputs: { email: { column: 'email' } },
  },
  {
    key: 'score',
    kind: 'enrichment',
    provider: 'scorer',
    autoRun: true,
    inputs: { e: { column: 'email' } },
  },
  { key: 'manual', kind: 'enrichment', provider: 'x', inputs: { e: { column: 'email' } } },
];

function compile(properties = {}) {
  return compileEnrichmentComplete({
    properties: {
      columnDefs,
      filter: { org: 'o1' },
      results: [
        { rowKey: 'r1', columnKey: 'email', claimToken: token, status: 'ok', value: 'a@b' },
      ],
      ...properties,
    },
    tenantScoped: false,
  });
}

function result(overrides) {
  return { rowKey: 'r1', columnKey: 'email', claimToken: token, status: 'ok', ...overrides };
}

describe('compileEnrichmentComplete', () => {
  test('parses results and takes the inputHash from the claim token', () => {
    const compiled = compile();
    expect(compiled.maxAttempts).toBe(3);
    expect(compiled.backoffMs).toBe(30000);
    expect(compiled.rawMaxBytes).toBe(65536);
    expect(compiled.results).toEqual([
      {
        rowKey: 'r1',
        keyForms: ['r1'],
        columnKey: 'email',
        claimToken: token,
        inputHash: '0123456789abcd',
        status: 'ok',
        value: 'a@b',
        raw: undefined,
        error: null,
        retry: true,
      },
    ]);
    expect(compiled.downstreamByColumn.get('email')).toEqual(['pitch', 'score']);
  });

  test('reads numeric and ObjectId row keys', () => {
    const id = new ObjectId();
    const compiled = compile({
      results: [result({ rowKey: '5' }), result({ rowKey: id, columnKey: 'pitch' })],
    });
    expect(compiled.results[0].keyForms).toEqual([5, '5']);
    expect(compiled.results[1].keyForms).toEqual([id]);
  });

  test('gives an error result a default message and truncates a long one', () => {
    expect(compile({ results: [result({ status: 'error' })] }).results[0].error).toBe(
      'Enrichment failed.'
    );
    expect(
      compile({ results: [result({ status: 'error', error: 'x'.repeat(3000) })] }).results[0].error
    ).toHaveLength(2000);
  });

  test('refuses results that do not name a claimed cell', () => {
    const run = (item) => () => compile({ results: [item] });
    expect(run('x')).toThrow('"results" item 0 should be { rowKey, columnKey, claimToken');
    expect(run(result({ owner: 'me' }))).toThrow('has an unknown key');
    expect(run(result({ columnKey: 'domain' }))).toThrow(
      '"columnKey" should be an enrichment or ai column'
    );
    expect(run(result({ claimToken: 'guess' }))).toThrow('"claimToken" should be the claimToken');
    expect(run(result({ status: 'done' }))).toThrow('"status" should be one of');
    expect(run(result({ retry: 'no' }))).toThrow('"retry" should be a boolean');
    expect(run(result({ error: 5, status: 'error' }))).toThrow('"error" should be a string');
    expect(run(result({ rowKey: { $ne: null } }))).toThrow(
      'MongoDBEnrichmentComplete "results" has an invalid row key'
    );
  });

  test('refuses a cell named twice, too many results and a results value that is not an array', () => {
    expect(() => compile({ results: [result({ rowKey: 5 }), result({ rowKey: '5' })] })).toThrow(
      'repeats a cell of an earlier result'
    );
    expect(() => compile({ results: Array.from({ length: 1001 }, () => result({})) })).toThrow(
      'more than 1000'
    );
    expect(() => compile({ results: {} })).toThrow('"results" should be an array');
  });

  test('refuses limits out of range', () => {
    expect(() => compile({ maxAttempts: 101 })).toThrow('"maxAttempts" should be an integer');
    expect(() => compile({ backoffMs: -1 })).toThrow('"backoffMs" should be an integer from 0');
    expect(() => compile({ rawMaxBytes: 10 })).toThrow(
      '"rawMaxBytes" should be an integer from 1024'
    );
  });
});

describe('planCompleteCell', () => {
  const compiled = compile();
  const doc = { _id: 'id1', _enrich: { email: { attempts: 1 } } };
  const match = {
    $and: [
      { org: 'o1' },
      { _id: 'id1' },
      { '_enrich.email.claimToken': token },
      { '_enrich.email.status': 'running' },
    ],
  };

  function plan(overrides, planDoc = doc, planCompiled = compiled) {
    const [parsed] = compileEnrichmentComplete({
      properties: { columnDefs, filter: { org: 'o1' }, results: [result(overrides)] },
    }).results;
    return planCompleteCell({ result: parsed, doc: planDoc, compiled: planCompiled, now });
  }

  test('an ok result replaces value and raw, stores the inputHash and clears the error', () => {
    expect(plan({ value: 'a@b', raw: { source: 'x' } })).toEqual({
      kind: 'ok',
      operation: {
        updateOne: {
          filter: match,
          update: {
            $set: {
              '_enrich.email.status': 'ok',
              '_enrich.email.inputHash': '0123456789abcd',
              '_enrich.email.finishedAt': now,
              '_enrich.email.value': 'a@b',
              '_enrich.email.raw': { source: 'x' },
            },
            $unset: { '_enrich.email.error': '', '_enrich.email.leaseUntil': '' },
          },
        },
      },
    });
  });

  test('an empty result has no value, and a result without raw clears the old raw', () => {
    expect(plan({ status: 'empty', value: 'ignored' }).operation.updateOne.update).toEqual({
      $set: {
        '_enrich.email.status': 'empty',
        '_enrich.email.inputHash': '0123456789abcd',
        '_enrich.email.finishedAt': now,
      },
      $unset: {
        '_enrich.email.error': '',
        '_enrich.email.leaseUntil': '',
        '_enrich.email.value': '',
        '_enrich.email.raw': '',
      },
    });
  });

  test('an error below maxAttempts is queued again after an exponential backoff', () => {
    const first = plan({ status: 'error', error: 'rate limited' });
    expect(first.kind).toBe('requeue');
    expect(first.operation.updateOne.update).toEqual({
      $set: {
        '_enrich.email.status': 'queued',
        '_enrich.email.queuedAt': new Date('2026-09-29T10:00:30.000Z'),
        '_enrich.email.error': 'rate limited',
      },
      $unset: { '_enrich.email.leaseUntil': '', '_enrich.email.startedAt': '' },
    });
    const second = plan({ status: 'error' }, { _id: 'id1', _enrich: { email: { attempts: 2 } } });
    expect(second.operation.updateOne.update.$set['_enrich.email.queuedAt']).toEqual(
      new Date('2026-09-29T10:01:00.000Z')
    );
  });

  test('the backoff is at most a day', () => {
    const long = compileEnrichmentComplete({
      properties: {
        columnDefs,
        filter: {},
        maxAttempts: 100,
        backoffMs: 86400000,
        results: [result({ status: 'error' })],
      },
    });
    const cell = planCompleteCell({
      result: long.results[0],
      doc: { _id: 'id1', _enrich: { email: { attempts: 40 } } },
      compiled: long,
      now,
    });
    expect(cell.operation.updateOne.update.$set['_enrich.email.queuedAt']).toEqual(
      new Date(now.getTime() + 86400000)
    );
  });

  test('an error on the last attempt, or with retry false, is final and keeps the value', () => {
    const last = plan(
      { status: 'error', error: 'bad' },
      { _id: 'id1', _enrich: { email: { attempts: 3 } } }
    );
    expect(last.kind).toBe('error');
    expect(last.operation.updateOne.update).toEqual({
      $set: {
        '_enrich.email.status': 'error',
        '_enrich.email.error': 'bad',
        '_enrich.email.finishedAt': now,
      },
      $unset: { '_enrich.email.leaseUntil': '' },
    });
    expect(plan({ status: 'error', retry: false }).kind).toBe('error');
  });

  test('a value larger than rawMaxBytes is a final error', () => {
    const cell = plan({ value: 'x'.repeat(70000) });
    expect(cell.kind).toBe('error');
    expect(cell.operation.updateOne.update.$set['_enrich.email.error']).toMatch(
      /^The result value is \d+ bytes, more than rawMaxBytes \(65536\)\.$/
    );
  });
});

describe('limitRaw', () => {
  test('keeps a raw within the limit and replaces a larger one with a marker', () => {
    expect(limitRaw({ raw: { a: 1 }, rawMaxBytes: 1024 })).toEqual({ a: 1 });
    const marker = limitRaw({ raw: { text: 'y'.repeat(5000) }, rawMaxBytes: 1024 });
    expect(marker).toEqual({
      _truncated: true,
      bytes: expect.any(Number),
      maxBytes: 1024,
      preview: `{"text":"${'y'.repeat(991)}`,
    });
    expect(marker.bytes).toBeGreaterThan(5000);
  });
});

describe('getDownstream', () => {
  test('lists the autoRun columns of cells that completed ok, once per row', () => {
    const { downstreamByColumn } = compile();
    expect(
      getDownstream({
        applied: [
          { kind: 'ok', result: { rowKey: 5, columnKey: 'email' } },
          { kind: 'error', result: { rowKey: 6, columnKey: 'email' } },
          { kind: 'ok', result: { rowKey: 7, columnKey: 'pitch' } },
        ],
        downstreamByColumn,
      })
    ).toEqual([{ rowKey: 5, columns: ['pitch', 'score'] }]);
  });
});

test('the schema accepts a full request and refuses unknown result keys', () => {
  expect(
    validate({
      schema,
      data: {
        columnDefs,
        results: [result({ raw: { a: 1 }, error: 'x', retry: false })],
        maxAttempts: 5,
        backoffMs: 0,
        rawMaxBytes: 2048,
        filter: {},
      },
    })
  ).toEqual({ valid: true });
  expect(() => validate({ schema, data: { columnDefs, results: [result({ owner: 1 })] } })).toThrow(
    'MongoDBEnrichmentComplete request "results" items should only have'
  );
});

test('the schema and compile take error and retry null as not given', () => {
  // `_step` yields null for a key the provider step did not return.
  const nulls = result({ status: 'ok', value: 'a@b', error: null, retry: null });
  expect(validate({ schema, data: { columnDefs, results: [nulls] } })).toEqual({ valid: true });
  const failed = result({ status: 'error', error: null, retry: null });
  expect(validate({ schema, data: { columnDefs, results: [failed] } })).toEqual({ valid: true });
  expect(() => compile({ results: [nulls] })).not.toThrow();
  expect(() => compile({ results: [failed] })).not.toThrow();
});
