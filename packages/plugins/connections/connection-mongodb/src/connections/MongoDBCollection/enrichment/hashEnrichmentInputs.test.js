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
import { readFile } from 'node:fs/promises';
import { Binary, Decimal128, Long, ObjectId } from 'mongodb';
import { serializer } from '@lowdefy/helpers';

import canonicalJson from './canonicalJson.js';
import cyrb53 from './cyrb53.js';
import hashEnrichmentInputs from './hashEnrichmentInputs.js';

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

async function readFixture() {
  const text = await readFile(
    new URL('../../../../test/enrichmentInputHash.json', import.meta.url),
    'utf8'
  );
  return JSON.parse(text);
}

test('cyrb53 matches the published test vectors of the reference implementation', () => {
  expect(cyrb53('a')).toBe(7929297801672961);
  expect(cyrb53('b')).toBe(8684336938537663);
  expect(cyrb53('revenge')).toBe(4051478007546757);
  expect(cyrb53('revenue')).toBe(8309097637345594);
  expect(cyrb53('revenue', 1)).toBe(8697026808958300);
});

test('hashEnrichmentInputs gives every fixture hash and canonical text', async () => {
  const fixture = await readFixture();
  expect(fixture.cases.length).toBeGreaterThanOrEqual(12);
  fixture.cases.forEach(({ name, inputs, canonical, hash }) => {
    const revived = reviveTyped(serializer.deserialize(inputs));
    expect({ name, canonical: canonicalJson(revived) }).toEqual({ name, canonical });
    expect({ name, hash: hashEnrichmentInputs(revived) }).toEqual({ name, hash });
  });
});

test('hashEnrichmentInputs is 14 lowercase hex digits', async () => {
  const fixture = await readFixture();
  fixture.cases.forEach(({ hash }) => {
    expect(hash).toMatch(/^[0-9a-f]{14}$/);
  });
});

test('hashEnrichmentInputs does not depend on key order at any depth', () => {
  expect(hashEnrichmentInputs({ a: 1, b: { c: 2, d: [{ e: 3, f: 4 }] } })).toBe(
    hashEnrichmentInputs({ b: { d: [{ f: 4, e: 3 }], c: 2 }, a: 1 })
  );
});

test('hashEnrichmentInputs keeps array order', () => {
  expect(hashEnrichmentInputs({ list: [1, 2] })).not.toBe(hashEnrichmentInputs({ list: [2, 1] }));
});

test('hashEnrichmentInputs drops undefined object values and prints undefined array items as null', () => {
  expect(hashEnrichmentInputs({ a: 1, b: undefined })).toBe(hashEnrichmentInputs({ a: 1 }));
  expect(canonicalJson({ list: [1, undefined, 3] })).toBe('{"list":[1,null,3]}');
});

test('an ObjectId and its { _oid } marker hash as the same hex string', () => {
  const id = ObjectId.createFromHexString('64b7f0c2a1b2c3d4e5f60718');
  expect(canonicalJson({ id })).toBe('{"id":"64b7f0c2a1b2c3d4e5f60718"}');
  expect(hashEnrichmentInputs({ id })).toBe(
    hashEnrichmentInputs({ id: { _oid: '64B7F0C2A1B2C3D4E5F60718' } })
  );
  expect(hashEnrichmentInputs({ id })).toBe(
    hashEnrichmentInputs({ id: '64b7f0c2a1b2c3d4e5f60718' })
  );
});

test('a Date hashes as its ISO string and an invalid Date as null', () => {
  const date = new Date('2024-02-29T12:00:00.000Z');
  expect(hashEnrichmentInputs({ date })).toBe(
    hashEnrichmentInputs({ date: '2024-02-29T12:00:00.000Z' })
  );
  expect(canonicalJson({ date: new Date('not a date') })).toBe('{"date":null}');
});

test('numbers print as JSON prints them', () => {
  expect(canonicalJson({ a: -0, b: NaN, c: Infinity, d: 1e21, e: 2.5 })).toBe(
    '{"a":0,"b":null,"c":null,"d":1e+21,"e":2.5}'
  );
});

test('a string and a number of the same text hash differently', () => {
  expect(hashEnrichmentInputs({ a: 5 })).not.toBe(hashEnrichmentInputs({ a: '5' }));
});

test('driver values hash as the JSON form the browser receives them in', () => {
  const inputs = {
    price: Decimal128.fromString('1.50'),
    big: Long.fromString('9007199254740993'),
    blob: new Binary(Buffer.from('hi')),
    id: ObjectId.createFromHexString('64b7f0c2a1b2c3d4e5f60718'),
  };
  const wire = JSON.parse(JSON.stringify({ ...inputs, id: { _oid: inputs.id.toHexString() } }));
  expect(canonicalJson(inputs)).toBe(canonicalJson(wire));
  expect(hashEnrichmentInputs(inputs)).toBe(hashEnrichmentInputs(wire));
});

test('a bigint hashes as the number with the same digits', () => {
  expect(canonicalJson({ n: 5n })).toBe('{"n":5}');
  expect(hashEnrichmentInputs({ n: 5n })).toBe(hashEnrichmentInputs({ n: 5 }));
});
