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
import { validate } from '@lowdefy/ajv';

import hashEnrichmentInputs from '../enrichment/hashEnrichmentInputs.js';
import compileEnrichmentClaim from './compileEnrichmentClaim.js';
import planClaimCell from './planClaimCell.js';
import schema from './schema.js';

const now = new Date('2026-09-29T10:00:00.000Z');

const fields = {
  name: { type: 'text' },
  domain: { type: 'url', path: 'web.domain' },
};

const columnDefs = [
  { key: 'name' },
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
    prompt: 'Write a pitch for {{ name }}',
    inputs: { name: { column: 'name' }, email: { column: 'email' } },
  },
];

function compile(properties = {}, { tenantScoped = false } = {}) {
  return compileEnrichmentClaim({
    properties: { fields, columnDefs, filter: { org: 'o1' }, ...properties },
    tenantScoped,
  });
}

const claimable = {
  $or: [
    { '_enrich.email.status': 'queued', '_enrich.email.queuedAt': { $lte: now } },
    { '_enrich.email.status': 'running', '_enrich.email.leaseUntil': { $lt: now } },
  ],
};

describe('compileEnrichmentClaim', () => {
  test('claims every enrichment column by default, with the defaults', () => {
    const compiled = compile();
    expect(compiled.limit).toBe(20);
    expect(compiled.leaseMs).toBe(120000);
    expect(compiled.maxAttempts).toBe(3);
    expect(compiled.targets.map((target) => target.columnKey)).toEqual(['email', 'pitch']);
    expect(compiled.targets[0].projection).toEqual({
      _id: 1,
      '_enrich.email.attempts': 1,
      '_enrich.email.claimToken': 1,
      '_enrich.email.queuedAt': 1,
      '_enrich.email.runId': 1,
      '_enrich.email.status': 1,
      name: 1,
      'web.domain': 1,
    });
  });

  test('narrows the columns to columns and providers', () => {
    expect(compile({ columns: ['pitch'] }).targets.map((target) => target.columnKey)).toEqual([
      'pitch',
    ]);
    expect(compile({ providers: ['finder'] }).targets.map((target) => target.provider)).toEqual([
      'finder',
    ]);
    expect(compile({ providers: ['other'] }).targets).toEqual([]);
  });

  test('refuses limits out of range', () => {
    expect(() => compile({ limit: 201 })).toThrow(
      'MongoDBEnrichmentClaim "limit" should be an integer from 1 to 200'
    );
    expect(() => compile({ leaseMs: 10 })).toThrow('"leaseMs" should be an integer from 1000');
    expect(() => compile({ maxAttempts: 0 })).toThrow('"maxAttempts" should be an integer from 1');
  });

  test('refuses a request without fields or a scoping filter', () => {
    expect(() => compile({ fields: {} })).toThrow('MongoDBEnrichmentClaim requires "fields"');
    expect(() => compile({ filter: undefined })).toThrow(
      'MongoDBEnrichmentClaim requires a "filter"'
    );
    expect(compile({ filter: undefined }, { tenantScoped: true }).filter).toEqual({});
    expect(() => compile({ columns: ['name'] })).toThrow('not an enrichment or ai column');
  });
});

describe('planClaimCell', () => {
  const compiled = compile();
  const [emailTarget, pitchTarget] = compiled.targets;
  const generateToken = () => 'a'.repeat(24);

  test('claims a queued cell with a compare-and-set of the state it read', () => {
    const doc = {
      _id: 'r1',
      name: 'Acme',
      web: { domain: 'acme.test', secret: 'x' },
      _enrich: { email: { status: 'queued', runId: 'run1', attempts: 0 } },
    };
    const inputHash = hashEnrichmentInputs({ domain: 'acme.test' });
    const cell = planClaimCell({ doc, target: emailTarget, compiled, now, generateToken });
    expect(cell.kind).toBe('claim');
    expect(cell.operation.updateOne).toEqual({
      filter: {
        $and: [
          { org: 'o1' },
          { _id: 'r1' },
          claimable,
          { '_enrich.email.status': 'queued' },
          { '_enrich.email.claimToken': null },
          { '_enrich.email.attempts': 0 },
          { '_enrich.email.runId': 'run1' },
        ],
      },
      update: {
        $set: {
          '_enrich.email.status': 'running',
          '_enrich.email.startedAt': now,
          '_enrich.email.leaseUntil': new Date('2026-09-29T10:02:00.000Z'),
          '_enrich.email.attempts': 1,
          '_enrich.email.claimToken': `${'a'.repeat(24)}:${inputHash}`,
        },
      },
    });
    expect(cell.claim).toEqual({
      rowKey: 'r1',
      columnKey: 'email',
      provider: 'finder',
      runId: 'run1',
      claimToken: `${'a'.repeat(24)}:${inputHash}`,
      attempt: 1,
      inputHash,
      inputs: { domain: 'acme.test' },
      row: { _id: 'r1', name: 'Acme', web: { domain: 'acme.test' } },
    });
  });

  test('an ai claim carries its prompt', () => {
    const doc = {
      _id: 'r1',
      name: 'Acme',
      _enrich: {
        email: { status: 'ok', value: 'ada@acme.test' },
        pitch: { status: 'queued', attempts: 0 },
      },
    };
    const cell = planClaimCell({ doc, target: pitchTarget, compiled, now, generateToken });
    expect(cell.claim.prompt).toBe('Write a pitch for {{ name }}');
    expect(cell.claim.inputs).toEqual({ name: 'Acme', email: 'ada@acme.test' });
  });

  test('reclaims an expired running cell as the next attempt', () => {
    const doc = {
      _id: 'r1',
      web: { domain: 'acme.test' },
      _enrich: { email: { status: 'running', attempts: 1, claimToken: 'old', runId: 'run1' } },
    };
    const cell = planClaimCell({ doc, target: emailTarget, compiled, now, generateToken });
    expect(cell.kind).toBe('claim');
    expect(cell.claim.attempt).toBe(2);
    expect(cell.operation.updateOne.filter.$and).toContainEqual({
      '_enrich.email.claimToken': 'old',
    });
  });

  test('an expired lease on the last attempt makes the cell an error', () => {
    const doc = {
      _id: 'r1',
      web: { domain: 'acme.test' },
      _enrich: { email: { status: 'running', attempts: 3, claimToken: 'old' } },
    };
    const cell = planClaimCell({ doc, target: emailTarget, compiled, now, generateToken });
    expect(cell.kind).toBe('expired');
    expect(cell.operation.updateOne.update.$set).toEqual({
      '_enrich.email.status': 'error',
      '_enrich.email.error': "The worker's lease ran out on attempt 3 of 3.",
      '_enrich.email.finishedAt': now,
    });
  });

  test('a cell whose input is missing now is set to empty', () => {
    const doc = { _id: 'r1', _enrich: { email: { status: 'queued', attempts: 0 } } };
    const cell = planClaimCell({ doc, target: emailTarget, compiled, now, generateToken });
    expect(cell.kind).toBe('missing');
    expect(cell.operation.updateOne.update.$set).toEqual({
      '_enrich.email.status': 'empty',
      '_enrich.email.error': 'Missing input: domain',
      '_enrich.email.finishedAt': now,
    });
  });

  test('a cell whose enrichment input is still running is deferred', () => {
    const doc = {
      _id: 'r1',
      name: 'Acme',
      _enrich: { email: { status: 'running' }, pitch: { status: 'queued', attempts: 0 } },
    };
    const cell = planClaimCell({ doc, target: pitchTarget, compiled, now, generateToken });
    expect(cell.kind).toBe('defer');
    expect(cell.operation.updateOne.update.$set).toEqual({
      '_enrich.pitch.status': 'queued',
      '_enrich.pitch.queuedAt': new Date('2026-09-29T10:00:15.000Z'),
    });
  });
});

test('the schema accepts a full request and refuses a limit above 200', () => {
  expect(
    validate({
      schema,
      data: {
        columns: ['email'],
        columnDefs,
        fields,
        providers: ['finder'],
        limit: 10,
        leaseMs: 60000,
        maxAttempts: 5,
        filter: {},
      },
    })
  ).toEqual({ valid: true });
  expect(() => validate({ schema, data: { columnDefs, fields, limit: 500 } })).toThrow(
    'MongoDBEnrichmentClaim request property "limit" should be at most 200.'
  );
});
