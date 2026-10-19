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

/* global BigInt */

import fs from 'fs';
import { serializer } from '@lowdefy/helpers';

import cyrb53 from './cyrb53.js';
import hashEnrichmentInputs from './hashEnrichmentInputs.js';
import toCanonicalJson from './toCanonicalJson.js';

// The same fixture is checked into @lowdefy/connection-mongodb (test/enrichmentInputHash.json),
// where the enrichment requests hash the inputs on the server: both copies must stay identical.
// Inputs are serializer JSON (`~d` dates), revived before hashing.
// The markers the fixture uses for values JSON can not hold (see its description).
function reviveTyped(value) {
  if (Array.isArray(value)) return value.map(reviveTyped);
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === '~bigint') return BigInt(value['~bigint']);
  if (keys.length === 1 && keys[0] === '~toJSON') {
    const json = value['~toJSON'];
    return { toJSON: () => json };
  }
  return Object.fromEntries(keys.map((key) => [key, reviveTyped(value[key])]));
}

const fixture = JSON.parse(
  fs.readFileSync(new URL('../../test/enrichmentInputHash.json', import.meta.url), 'utf8')
);

test.each(fixture.cases.map((entry) => [entry.name, entry]))(
  'hashEnrichmentInputs matches the shared fixture: %s',
  (name, entry) => {
    const inputs = reviveTyped(serializer.deserialize(entry.inputs));
    expect(toCanonicalJson(inputs)).toBe(entry.canonical);
    expect(hashEnrichmentInputs(inputs)).toBe(entry.hash);
  }
);

test('cyrb53 matches the reference values of the published algorithm', () => {
  expect(cyrb53('a')).toBe(7929297801672961);
  expect(cyrb53('b')).toBe(8684336938537663);
  expect(cyrb53('revenge')).toBe(4051478007546757);
  expect(cyrb53('revenue')).toBe(8309097637345594);
  expect(cyrb53('revenue', 1)).toBe(8697026808958300);
});

test('hashEnrichmentInputs is 14 lowercase hex characters', () => {
  expect(hashEnrichmentInputs({ domain: 'acme.com' })).toMatch(/^[0-9a-f]{14}$/);
});

test('hashEnrichmentInputs ignores key order at every depth', () => {
  expect(hashEnrichmentInputs({ a: 1, b: { d: 2, c: [1, { f: 1, e: 2 }] } })).toBe(
    hashEnrichmentInputs({ b: { c: [1, { e: 2, f: 1 }], d: 2 }, a: 1 })
  );
});

test('hashEnrichmentInputs hashes an undefined input like a missing one', () => {
  expect(hashEnrichmentInputs({ domain: 'acme.com', name: undefined })).toBe(
    hashEnrichmentInputs({ domain: 'acme.com' })
  );
});

test('toCanonicalJson writes undefined array items as null, like JSON.stringify', () => {
  expect(toCanonicalJson([1, undefined, 3])).toBe('[1,null,3]');
});

test('toCanonicalJson writes a Date as its ISO string and a driver ObjectId as hex', () => {
  const objectId = { _bsontype: 'ObjectId', toHexString: () => '65f0c0ffee0000000000abcd' };
  expect(toCanonicalJson({ at: new Date('2026-01-01T00:00:00.000Z'), id: objectId })).toBe(
    '{"at":"2026-01-01T00:00:00.000Z","id":"65f0c0ffee0000000000abcd"}'
  );
});

test('toCanonicalJson keeps an object with an _oid that is not an ObjectId as an object', () => {
  expect(toCanonicalJson({ _oid: 'not-hex' })).toBe('{"_oid":"not-hex"}');
});

test('toCanonicalJson writes non-finite numbers as null', () => {
  expect(toCanonicalJson({ a: NaN, b: Infinity })).toBe('{"a":null,"b":null}');
});

test('hashEnrichmentInputs gives different hashes for different values', () => {
  expect(hashEnrichmentInputs({ domain: 'acme.com' })).not.toBe(
    hashEnrichmentInputs({ domain: 'acme.co' })
  );
  expect(hashEnrichmentInputs({ n: 1 })).not.toBe(hashEnrichmentInputs({ n: '1' }));
});

test('toCanonicalJson writes an object with toJSON as its JSON form, and a bigint as digits', () => {
  const decimal = { toJSON: () => ({ $numberDecimal: '1.50' }), bytes: [1, 2] };
  expect(toCanonicalJson({ price: decimal, n: 5n })).toBe(
    '{"n":5,"price":{"$numberDecimal":"1.50"}}'
  );
  expect(hashEnrichmentInputs({ n: 5n })).toBe(hashEnrichmentInputs({ n: 5 }));
});
