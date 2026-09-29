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

import normalizeFields from '../MongoDBTableQuery/normalizeFields.js';
import buildCellUpdate from './buildCellUpdate.js';
import buildProjection from './buildProjection.js';
import getEnrichmentFilter from './getEnrichmentFilter.js';
import getTargetColumns from './getTargetColumns.js';
import parseColumnDefs from './parseColumnDefs.js';
import pickRow from './pickRow.js';
import resolveCellInputs from './resolveCellInputs.js';
import resolveInputSources from './resolveInputSources.js';

const requestType = 'TestRequest';

const columnDefs = [
  { key: 'company', title: 'Company', type: 'text' },
  { key: 'domain', type: 'url', kind: 'input' },
  {
    key: 'email',
    kind: 'enrichment',
    provider: 'finder',
    inputs: { domain: { column: 'domain' }, company: { column: 'company', required: false } },
    autoRun: true,
  },
  {
    key: 'summary',
    kind: 'ai',
    prompt: 'Summarise {{ company }} for {{ email }}',
    inputs: { company: { column: 'company' }, email: { column: 'email' }, words: { value: 50 } },
  },
  { key: 'first', kind: 'formula', template: '{{ company }}' },
];

function parse(defs) {
  return parseColumnDefs({ columnDefs: defs, requestType });
}

describe('parseColumnDefs', () => {
  test('parses enrichment and ai columns and keeps other columns as lookups', () => {
    const byKey = parse(columnDefs);
    expect(byKey.get('company')).toEqual({ key: 'company', kind: null, runnable: false });
    expect(byKey.get('email')).toEqual({
      key: 'email',
      kind: 'enrichment',
      runnable: true,
      provider: 'finder',
      prompt: null,
      autoRun: true,
      inputs: [
        { param: 'domain', column: 'domain', required: true },
        { param: 'company', column: 'company', required: false },
      ],
    });
    expect(byKey.get('summary').provider).toBe('ai');
    expect(byKey.get('summary').inputs[2]).toEqual({ param: 'words', value: 50 });
  });

  test('refuses a columnDefs value that is not a non-empty array', () => {
    expect(() => parse([])).toThrow('TestRequest "columnDefs" should be a non-empty array');
    expect(() => parse({ key: 'a' })).toThrow('should be a non-empty array');
  });

  test('refuses a column without a string key and duplicate keys', () => {
    expect(() => parse([{ title: 'x' }])).toThrow('with a string "key"');
    expect(() => parse([{ key: 'a' }, { key: 'a' }])).toThrow('has a duplicate column key');
  });

  test('refuses an unknown kind', () => {
    expect(() => parse([{ key: 'a', kind: 'webhook' }])).toThrow('"kind" should be one of');
  });

  test('refuses enrichment column keys that are not one plain path segment', () => {
    ['a.b', '$where', '__proto__', 'a b', ''].forEach((key) => {
      expect(() => parse([{ key, kind: 'ai' }])).toThrow();
    });
    expect(() => parse([{ key: 'a.b', kind: 'ai' }])).toThrow('path segment under "_enrich"');
    // Only runnable columns are written under _enrich; a declared column key may be a dot path.
    expect(parse([{ key: 'owner.name' }]).get('owner.name').runnable).toBe(false);
  });

  test('refuses an enrichment column without a provider id', () => {
    expect(() => parse([{ key: 'e', kind: 'enrichment' }])).toThrow('should have a "provider" id');
    expect(() => parse([{ key: 'e', kind: 'enrichment', provider: 'a/b' }])).toThrow(
      '"provider" id'
    );
  });

  test('refuses inputs that are not { column } or { value }', () => {
    const run = (inputs) => parse([{ key: 'e', kind: 'ai', inputs }]);
    expect(() => run([])).toThrow('"inputs" should be an object');
    expect(() => run({ p: 'domain' })).toThrow('should be { column } or { value }');
    expect(() => run({ p: { column: 'd', path: 'x' } })).toThrow(
      'should be { column, required? } or { value }'
    );
    expect(() => run({ p: { column: 'd', required: 'yes' } })).toThrow('{ column, required? }');
    expect(() => run({ p: { column: 5 } })).toThrow('{ column, required? }');
    expect(() => run({ 'a.b': { column: 'd' } })).toThrow('input name that is not a plain key');
    expect(() => run(JSON.parse('{"__proto__":{"column":"d"}}'))).toThrow(
      'input name that is not a plain key'
    );
    expect(() => run({ p: { column: 'e' } })).toThrow('reads the column itself');
  });

  test('refuses a prompt that is not a string and a non-boolean autoRun', () => {
    expect(() => parse([{ key: 'e', kind: 'ai', prompt: 5 }])).toThrow(
      '"prompt" should be a string'
    );
    expect(() => parse([{ key: 'e', kind: 'ai', autoRun: 'yes' }])).toThrow(
      '"autoRun" should be a boolean'
    );
  });

  test('refuses an input cycle between enrichment columns', () => {
    expect(() =>
      parse([
        { key: 'a', kind: 'ai', inputs: { x: { column: 'b' } } },
        { key: 'b', kind: 'ai', inputs: { x: { column: 'c' } } },
        { key: 'c', kind: 'ai', inputs: { x: { column: 'a' } } },
      ])
    ).toThrow('has an input cycle: a -> b -> c -> a');
  });

  test('refuses too many columns and too many inputs', () => {
    expect(() => parse(Array.from({ length: 501 }, (_, index) => ({ key: `c${index}` })))).toThrow(
      'more than 500'
    );
    const inputs = Object.fromEntries(
      Array.from({ length: 51 }, (_, index) => [`p${index}`, { value: index }])
    );
    expect(() => parse([{ key: 'e', kind: 'ai', inputs }])).toThrow('51 inputs, more than 50');
  });
});

describe('getTargetColumns', () => {
  const columnDefsByKey = parse(columnDefs);

  test('returns the named enrichment columns once each', () => {
    const targets = getTargetColumns({
      columns: ['email', 'email', 'summary'],
      columnDefsByKey,
      required: true,
      requestType,
    });
    expect(targets.map((target) => target.key)).toEqual(['email', 'summary']);
  });

  test('defaults to every enrichment column when columns are optional', () => {
    const targets = getTargetColumns({ columnDefsByKey, required: false, requestType });
    expect(targets.map((target) => target.key)).toEqual(['email', 'summary']);
  });

  test('narrows the columns to the providers', () => {
    const targets = getTargetColumns({
      columnDefsByKey,
      providers: ['ai'],
      required: false,
      requestType,
    });
    expect(targets.map((target) => target.key)).toEqual(['summary']);
    expect(() =>
      getTargetColumns({ columnDefsByKey, providers: 'ai', required: false, requestType })
    ).toThrow('"providers" should be an array of provider ids');
  });

  test('refuses missing, non-enrichment and unknown columns', () => {
    expect(() => getTargetColumns({ columnDefsByKey, required: true, requestType })).toThrow(
      'TestRequest requires "columns"'
    );
    expect(() =>
      getTargetColumns({ columns: ['company'], columnDefsByKey, required: true, requestType })
    ).toThrow('"company", which is not an enrichment or ai column');
    expect(() =>
      getTargetColumns({ columns: ['nope'], columnDefsByKey, required: true, requestType })
    ).toThrow('not an enrichment or ai column');
    expect(() =>
      getTargetColumns({ columns: [], columnDefsByKey, required: true, requestType })
    ).toThrow('non-empty array of column keys');
  });
});

describe('input sources and cell inputs', () => {
  const columnDefsByKey = parse(columnDefs);
  const fieldsByKey = normalizeFields({
    fields: { company: { type: 'text', path: 'company.name' }, domain: { type: 'url' } },
  });
  const summarySources = resolveInputSources({
    columnDef: columnDefsByKey.get('summary'),
    columnDefsByKey,
    fieldsByKey,
    requestType,
  });

  test('a column input reads a field path or an enrichment value', () => {
    expect(summarySources).toEqual([
      {
        param: 'company',
        source: 'field',
        column: 'company',
        required: true,
        path: 'company.name',
      },
      {
        param: 'email',
        source: 'enrichment',
        column: 'email',
        required: true,
        statusPath: '_enrich.email.status',
        valuePath: '_enrich.email.value',
      },
      { param: 'words', source: 'value', value: 50 },
    ]);
  });

  test('a column input outside fields and the enrichment columns is refused', () => {
    expect(() =>
      resolveInputSources({
        columnDef: columnDefsByKey.get('summary'),
        columnDefsByKey,
        fieldsByKey: normalizeFields({ fields: { domain: { type: 'url' } } }),
        requestType,
      })
    ).toThrow(
      'TestRequest column "summary" input "company" reads column "company", which is neither an enrichment column of "columnDefs" nor in "fields".'
    );
  });

  test('resolves the inputs of a row whose inputs are ready', () => {
    const doc = {
      company: { name: 'Acme' },
      _enrich: { email: { status: 'ok', value: 'ada@acme.test' } },
    };
    expect(resolveCellInputs({ doc, sources: summarySources })).toEqual({
      inputs: { company: 'Acme', email: 'ada@acme.test', words: 50 },
      missing: null,
      waiting: false,
    });
  });

  test('names the first required input with no value', () => {
    expect(
      resolveCellInputs({ doc: { company: { name: '' } }, sources: summarySources }).missing
    ).toBe('company');
    expect(
      resolveCellInputs({
        doc: { company: { name: 'Acme' }, _enrich: { email: { status: 'error', value: 'old' } } },
        sources: summarySources,
      }).missing
    ).toBe('email');
    expect(
      resolveCellInputs({
        doc: { company: { name: 'Acme' }, _enrich: { email: { status: 'ok', value: null } } },
        sources: summarySources,
      }).missing
    ).toBe('email');
  });

  test('waits for an enrichment input that is queued or running', () => {
    ['queued', 'running'].forEach((status) => {
      expect(
        resolveCellInputs({
          doc: { company: { name: 'Acme' }, _enrich: { email: { status, value: 'old' } } },
          sources: summarySources,
        })
      ).toEqual({ inputs: { company: 'Acme', words: 50 }, missing: null, waiting: true });
    });
  });

  test('a missing input wins over waiting, and an optional input is left out', () => {
    expect(
      resolveCellInputs({
        doc: { _enrich: { email: { status: 'running' } } },
        sources: summarySources,
      })
    ).toEqual({ inputs: { words: 50 }, missing: 'company', waiting: false });
    const emailSources = resolveInputSources({
      columnDef: columnDefsByKey.get('email'),
      columnDefsByKey,
      fieldsByKey,
      requestType,
    });
    expect(resolveCellInputs({ doc: { domain: 'acme.test' }, sources: emailSources })).toEqual({
      inputs: { domain: 'acme.test' },
      missing: null,
      waiting: false,
    });
  });
});

describe('buildCellUpdate', () => {
  test('writes only cell properties of the column', () => {
    expect(
      buildCellUpdate({
        columnKey: 'email',
        set: { status: 'queued', attempts: 0 },
        unset: ['error'],
      })
    ).toEqual({
      $set: { '_enrich.email.status': 'queued', '_enrich.email.attempts': 0 },
      $unset: { '_enrich.email.error': '' },
    });
  });

  test('refuses any other property and an unsafe column key', () => {
    expect(() => buildCellUpdate({ columnKey: 'email', set: { owner: 'x' } })).toThrow(
      'Enrichment cell property "owner" can not be written.'
    );
    expect(() => buildCellUpdate({ columnKey: 'a.b', set: { status: 'ok' } })).toThrow(
      'is not a safe key'
    );
    expect(() => buildCellUpdate({ columnKey: 'email', unset: ['$where'] })).toThrow(
      'can not be written'
    );
  });
});

describe('buildProjection', () => {
  test('leaves out paths inside another projected path', () => {
    expect(
      buildProjection(['_id', '_enrich.a.status', '_enrich.a', 'name', 'name', 'owner.id'])
    ).toEqual({ _id: 1, '_enrich.a': 1, name: 1, 'owner.id': 1 });
  });
});

describe('getEnrichmentFilter', () => {
  test('requires a filter unless the connection is tenant-scoped', () => {
    expect(() => getEnrichmentFilter({ requestType })).toThrow(
      'TestRequest requires a "filter" that scopes the rows'
    );
    expect(getEnrichmentFilter({ tenantScoped: true, requestType })).toEqual({});
    expect(getEnrichmentFilter({ filter: {}, requestType })).toEqual({});
    expect(() => getEnrichmentFilter({ filter: [], requestType })).toThrow(
      '"filter" should be an object'
    );
  });

  test('refuses a filter that names _enrich', () => {
    expect(() =>
      getEnrichmentFilter({ filter: { '_enrich.a.status': 'ok' }, requestType })
    ).toThrow('"filter" matches "_enrich.a.status"');
    expect(() =>
      getEnrichmentFilter({ filter: { $or: [{ org: 'a' }, { _enrich: null }] }, requestType })
    ).toThrow('"filter" matches "_enrich"');
  });
});

describe('pickRow', () => {
  test('returns _id, the row key and the fields paths only', () => {
    const _id = new ObjectId();
    expect(
      pickRow({
        doc: { _id, key: 5, company: { name: 'Acme', secret: 1 }, password: 'x' },
        fieldsByKey: normalizeFields({
          fields: { company: { type: 'text', path: 'company.name' } },
        }),
        rowKeyField: 'key',
      })
    ).toEqual({ _id, key: 5, company: { name: 'Acme' } });
  });
});
