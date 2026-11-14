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

import { Decimal128, ObjectId } from 'mongodb';
import { serialize, deserialize } from './serialize.js';
import { expect, test } from 'vitest';

test('serialize with  dates', () => {
  const object = {
    date: new Date(0),
    array: [new Date(0)],
  };
  expect(serialize(object)).toEqual({
    date: new Date(0),
    array: [new Date(0)],
  });
});

test('deserialize does not turn dates to strings', () => {
  const object = {
    date: new Date(0),
    array: [new Date(0)],
  };
  expect(deserialize(object)).toEqual({
    date: new Date(0),
    array: [new Date(0)],
  });
});

test('serialize mongodb object id', () => {
  const object = {
    objectid: ObjectId.createFromHexString('5e53d8403108c4b9fa51765d'),
    array: [ObjectId.createFromHexString('5e53d8403108c4b9fa51765d')],
  };
  expect(serialize(object)).toEqual({
    objectid: { _oid: '5e53d8403108c4b9fa51765d' },
    array: [{ _oid: '5e53d8403108c4b9fa51765d' }],
  });
});

test('deserialize mongodb object id', () => {
  const object = {
    objectid: { _oid: '5e53d8403108c4b9fa51765d' },
    array: [{ _oid: '5e53d8403108c4b9fa51765d' }],
  };
  expect(deserialize(object)).toEqual({
    objectid: ObjectId.createFromHexString('5e53d8403108c4b9fa51765d'),
    array: [ObjectId.createFromHexString('5e53d8403108c4b9fa51765d')],
  });
});

test('undefined', () => {
  expect(deserialize(undefined)).toEqual(undefined);
  expect(serialize(undefined)).toEqual(undefined);
});

const decimalStrings = [
  '0.1',
  '0.10',
  '-12.5',
  '0',
  '0.00',
  '-0',
  '1000',
  '79228162514264337593543950335',
  '1234567890123456789012345678901234',
  '-0.000001234567890123456789012345678901234',
  '9.999999999999999999999999999999999E+6144',
];

test.each(decimalStrings)('serialize and deserialize decimal %s exactly', (value) => {
  const serialized = serialize({
    amount: Decimal128.fromString(value),
    array: [Decimal128.fromString(value)],
    nested: { deep: [{ amount: Decimal128.fromString(value) }] },
  });
  expect(serialized).toEqual({
    amount: { _decimal: value },
    array: [{ _decimal: value }],
    nested: { deep: [{ amount: { _decimal: value } }] },
  });
  const deserialized = deserialize(serialized);
  expect(deserialized.amount).toBeInstanceOf(Decimal128);
  expect(deserialized.amount.toString()).toEqual(value);
  expect(deserialized.array[0]).toBeInstanceOf(Decimal128);
  expect(deserialized.array[0].toString()).toEqual(value);
  expect(deserialized.nested.deep[0].amount.toString()).toEqual(value);
});

test('serialize a decimal in the form MongoDB prints it', () => {
  expect(serialize({ amount: Decimal128.fromString('0.0000001') })).toEqual({
    amount: { _decimal: '1E-7' },
  });
  expect(deserialize({ amount: { _decimal: '1E-7' } }).amount.toString()).toEqual('1E-7');
});

test('a decimal marker survives JSON, as it crosses to the browser and back', () => {
  const serialized = serialize({ amount: Decimal128.fromString('0.3') });
  const overTheWire = JSON.parse(JSON.stringify(serialized));
  expect(overTheWire).toEqual({ amount: { _decimal: '0.3' } });
  expect(deserialize(overTheWire).amount.toString()).toEqual('0.3');
});

test('serialize a Decimal128 from another copy of bson', () => {
  const foreign = { _bsontype: 'Decimal128', toString: () => '1.5' };
  expect(serialize({ amount: foreign })).toEqual({ amount: { _decimal: '1.5' } });
});

test('deserialize refuses a number as a decimal', () => {
  expect(() => deserialize({ amount: { _decimal: 0.1 } })).toThrow(
    "_decimal takes a decimal as a string, such as { _decimal: '12.50' }. Received 0.1."
  );
  expect(() => deserialize({ amount: { _decimal: null } })).toThrow(
    "_decimal takes a decimal as a string, such as { _decimal: '12.50' }. Received null."
  );
});

test('deserialize refuses a string that is not an exact decimal', () => {
  expect(() => deserialize({ amount: { _decimal: 'abc' } })).toThrow(
    '_decimal "abc" is not a decimal MongoDB can store exactly'
  );
  // 35 significant digits would have to be rounded.
  expect(() =>
    deserialize({ amount: { _decimal: '12345678901234567890123456789012345' } })
  ).toThrow('is not a decimal MongoDB can store exactly');
});

test('serialize leaves the object it was given unchanged', () => {
  const amount = Decimal128.fromString('1.5');
  const _id = ObjectId.createFromHexString('5e53d8403108c4b9fa51765d');
  const doc = { _id, amount, lines: [{ amount }] };
  expect(serialize(doc)).toEqual({
    _id: { _oid: '5e53d8403108c4b9fa51765d' },
    amount: { _decimal: '1.5' },
    lines: [{ amount: { _decimal: '1.5' } }],
  });
  expect(doc._id).toBe(_id);
  expect(doc.amount).toBe(amount);
  expect(doc.lines[0].amount).toBe(amount);
});
