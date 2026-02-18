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

import {
  ConfigError,
  LowdefyInternalError,
  OperatorError,
  ServiceError,
  UserError,
} from '@lowdefy/errors';

import extractErrorProps from './extractErrorProps.js';
import serializer from './serializer.js';

test('serialize convert object js date to ~d', () => {
  let object = {
    a: new Date(0),
  };
  expect(serializer.serialize(object)).toEqual({ a: { '~d': 0 } });
  object = {
    a: { b: { c: new Date(120) } },
  };
  expect(serializer.serialize(object)).toEqual({ a: { b: { c: { '~d': 120 } } } });
});

test('serialize convert array js date to ~d', () => {
  let object = {
    a: [new Date(0)],
  };
  expect(serializer.serialize(object)).toEqual({ a: [{ '~d': 0 }] });
  object = {
    a: [{ b: new Date(0), c: [null, new Date(10)], d: [{ e: new Date(20) }] }],
  };
  expect(serializer.serialize(object)).toEqual({
    a: [{ b: { '~d': 0 }, c: [null, { '~d': 10 }], d: [{ e: { '~d': 20 } }] }],
  });
});

test('serialize should not change a string date', () => {
  let object = {
    a: '2019-11-18T09:51:30.152Z',
  };
  expect(serializer.serialize(object)).toEqual(object);
  object = ['2019-11-18T09:51:30.152Z'];
  expect(serializer.serialize(object)).toEqual(object);
});

test('serialize a date should return a serialized date', () => {
  expect(serializer.serialize(new Date(0))).toEqual({ '~d': 0 });
});

test('serialize array of dates should return a serialized array', () => {
  expect(serializer.serialize([new Date(0), new Date(1), new Date(2)])).toEqual([
    { '~d': 0 },
    { '~d': 1 },
    { '~d': 2 },
  ]);
});

test('serialize primitives should pass', () => {
  expect(serializer.serialize('a')).toEqual('a');
  expect(serializer.serialize(0)).toEqual(0);
  expect(serializer.serialize(1)).toEqual(1);
  expect(serializer.serialize(-0.1)).toEqual(-0.1);
  expect(serializer.serialize(false)).toEqual(false);
  expect(serializer.serialize(true)).toEqual(true);
  expect(serializer.serialize(null)).toEqual(null);
  expect(serializer.serialize(undefined)).toEqual(undefined);
});

test('serializeToString convert object js date to ~d', () => {
  let object = {
    a: new Date(0),
  };
  expect(serializer.serializeToString(object)).toEqual('{"a":{"~d":0}}');
  object = {
    a: { b: { c: new Date(120) } },
  };
  expect(serializer.serializeToString(object)).toEqual('{"a":{"b":{"c":{"~d":120}}}}');
});

test('serializeToString convert array js date to _date', () => {
  let object = {
    a: [new Date(0)],
  };
  expect(serializer.serializeToString(object)).toEqual('{"a":[{"~d":0}]}');
  object = {
    a: [{ b: new Date(0), c: [null, new Date(10)], d: [{ e: new Date(20) }] }],
  };
  expect(serializer.serializeToString(object)).toEqual(
    '{"a":[{"b":{"~d":0},"c":[null,{"~d":10}],"d":[{"e":{"~d":20}}]}]}'
  );
});

test('serializeToString should not change a string date', () => {
  let object = {
    a: '2019-11-18T09:51:30.152Z',
  };
  expect(serializer.serializeToString(object)).toEqual('{"a":"2019-11-18T09:51:30.152Z"}');
  object = ['2019-11-18T09:51:30.152Z'];
  expect(serializer.serializeToString(object)).toEqual('["2019-11-18T09:51:30.152Z"]');
});

test('serializeToString a date should return a serialized date', () => {
  expect(serializer.serializeToString(new Date(0))).toEqual('{ "~d": 0 }');
});

test('serialize array of dates should return a serialized array', () => {
  expect(serializer.serializeToString([new Date(0), new Date(1), new Date(2)])).toEqual(
    '[{"~d":0},{"~d":1},{"~d":2}]'
  );
});

test('serializeToString primitives should pass', () => {
  expect(serializer.serializeToString('a')).toEqual('"a"');
  expect(serializer.serializeToString(0)).toEqual('0');
  expect(serializer.serializeToString(1)).toEqual('1');
  expect(serializer.serializeToString(-0.1)).toEqual('-0.1');
  expect(serializer.serializeToString(false)).toEqual('false');
  expect(serializer.serializeToString(true)).toEqual('true');
  expect(serializer.serializeToString(null)).toEqual('null');
  expect(serializer.serializeToString(undefined)).toEqual(undefined);
});

test('serializeToString stable option', () => {
  let object = {
    a: 'a',
    b: 'b',
    c: 'c',
  };
  expect(serializer.serializeToString(object, { stable: true })).toEqual(
    '{"a":"a","b":"b","c":"c"}'
  );
  object = {
    c: 'c',
    b: 'b',
    a: 'a',
  };
  expect(serializer.serializeToString(object, { stable: true })).toEqual(
    '{"a":"a","b":"b","c":"c"}'
  );
  object = {
    c: 'c',
    b: 'b',
    a: 'a',
  };
  expect(serializer.serializeToString(object, { stable: false })).toEqual(
    '{"c":"c","b":"b","a":"a"}'
  );
});

test('serializeToString stable and space option', () => {
  const object = {
    c: 'c',
    b: 'b',
    a: 'a',
  };
  expect(serializer.serializeToString(object, { stable: true, space: 2 })).toEqual(`{
  "a": "a",
  "b": "b",
  "c": "c"
}`);
});

test('serializeToString space option', () => {
  const object = {
    c: 'c',
    b: 'b',
    a: 'a',
  };
  expect(serializer.serializeToString(object, { space: 2 })).toEqual(`{
  "c": "c",
  "b": "b",
  "a": "a"
}`);
});

test('deserialize convert _date object to js date', () => {
  let object = {
    a: { '~d': 0 },
  };
  expect(serializer.deserialize(object)).toEqual({ a: new Date(0) });
  object = {
    a: { b: { c: { '~d': 120 } } },
  };
  expect(serializer.deserialize(object)).toEqual({ a: { b: { c: new Date(120) } } });
  object = {
    a: { '~d': '1970-01-01T00:00:00.000Z' },
  };
  expect(serializer.deserialize(object)).toEqual({ a: new Date(0) });
});

test('deserialize convert _date in array to js date', () => {
  let object = {
    a: [{ '~d': 0 }],
  };
  expect(serializer.deserialize(object)).toEqual({ a: [new Date(0)] });
  object = {
    a: [{ b: { '~d': 0 }, c: [null, { '~d': 10 }], d: [{ e: { '~d': 20 } }] }],
  };
  expect(serializer.deserialize(object)).toEqual({
    a: [{ b: new Date(0), c: [null, new Date(10)], d: [{ e: new Date(20) }] }],
  });
});

test('deserialize should not change a string date', () => {
  let object = {
    a: '2019-11-18T09:51:30.152Z',
  };
  expect(serializer.deserialize(object)).toEqual(object);
  object = ['2019-11-18T09:51:30.152Z'];
  expect(serializer.deserialize(object)).toEqual(object);
});

test('deserialize a _date date should return a js date', () => {
  expect(serializer.deserialize({ '~d': 0 })).toEqual(new Date(0));
  expect(serializer.deserialize({ '~d': '1970-01-01T00:00:00.000Z' })).toEqual(new Date(0));
});

test('deserialize array of _date dates should return a js date array', () => {
  expect(serializer.deserialize([{ '~d': 0 }, { '~d': 1 }, { '~d': 2 }])).toEqual([
    new Date(0),
    new Date(1),
    new Date(2),
  ]);
  expect(serializer.deserialize({ a: [{ '~d': '1970-01-01T00:00:00.000Z' }] })).toEqual({
    a: [new Date(0)],
  });
});

test('deserialize primitives should pass', () => {
  expect(serializer.deserialize('a')).toEqual('a');
  expect(serializer.deserialize(0)).toEqual(0);
  expect(serializer.deserialize(1)).toEqual(1);
  expect(serializer.deserialize(-0.1)).toEqual(-0.1);
  expect(serializer.deserialize(false)).toEqual(false);
  expect(serializer.deserialize(true)).toEqual(true);
  expect(serializer.deserialize(null)).toEqual(null);
  expect(serializer.deserialize(undefined)).toEqual(undefined);
});

test('deserializeFromString convert object js date to _date', () => {
  let object = `{ "a":{ "~d":0}}`;
  expect(serializer.deserializeFromString(object)).toEqual({
    a: new Date(0),
  });
  object = `{"a":{"b":{"c":{"~d":120}}}}`;
  expect(serializer.deserializeFromString(object)).toEqual({
    a: { b: { c: new Date(120) } },
  });
  object = `{ "a":{ "~d":"1970-01-01T00:00:00.000Z"}}`;
  expect(serializer.deserializeFromString(object)).toEqual({
    a: new Date(0),
  });
});

test('deserializeFromString convert array js date to _date', () => {
  let object = `{"a":[{"~d":0}]}`;
  expect(serializer.deserializeFromString(object)).toEqual({
    a: [new Date(0)],
  });
  object = `{"a":[{"b":{"~d":0},"c":[null,{"~d":10}],"d":[{"e":{"~d":20}}]}]}`;
  expect(serializer.deserializeFromString(object)).toEqual({
    a: [{ b: new Date(0), c: [null, new Date(10)], d: [{ e: new Date(20) }] }],
  });
});

test('deserializeFromString should not change a string date', () => {
  let object = `{"a":"2019-11-18T09:51:30.152Z"}`;
  expect(serializer.deserializeFromString(object)).toEqual({
    a: '2019-11-18T09:51:30.152Z',
  });
  object = `["2019-11-18T09:51:30.152Z"]`;
  expect(serializer.deserializeFromString(object)).toEqual(['2019-11-18T09:51:30.152Z']);
});

test('deserializeFromString a date should return a serialized date', () => {
  expect(serializer.deserializeFromString(`{"~d":0}`)).toEqual(new Date(0));
});

test('deserializeFromString array of dates should return a serialized array', () => {
  expect(serializer.deserializeFromString(`[{"~d":0},{"~d":1},{"~d":2}]`)).toEqual([
    new Date(0),
    new Date(1),
    new Date(2),
  ]);
  expect(serializer.deserializeFromString(`[{"~d":"1970-01-01T00:00:00.000Z"}]`)).toEqual([
    new Date(0),
  ]);
});

test('deserializeFromString primitives should pass', () => {
  expect(serializer.deserializeFromString(`"a"`)).toEqual('a');
  expect(serializer.deserializeFromString(`0`)).toEqual(0);
  expect(serializer.deserializeFromString(`1`)).toEqual(1);
  expect(serializer.deserializeFromString(`-0.1`)).toEqual(-0.1);
  expect(serializer.deserializeFromString(`false`)).toEqual(false);
  expect(serializer.deserializeFromString(`true`)).toEqual(true);
  expect(serializer.deserializeFromString(`null`)).toEqual(null);
  expect(() => {
    serializer.deserializeFromString(`undefined`);
  }).toThrow(); // does not work with undefined
});

test('Do not modify original object', () => {
  const a = { a: { b: [{ c: new Date(0) }] } };
  expect(serializer.deserializeFromString(serializer.serializeToString(a))).toEqual(a);
});

test('Undefined values in object', () => {
  const a = { a: undefined };
  expect(serializer.serialize(a)).toEqual({});
  expect(serializer.serializeToString(a)).toEqual('{}');
});

test('deserializeFromString undefined', () => {
  const a = undefined;
  expect(serializer.deserializeFromString(a)).toEqual(undefined);
});

test('copy an object', () => {
  const object = {
    date: new Date(0),
    array: [1, 'a', true, new Date(1)],
    string: 'hello',
    number: 42,
  };
  expect(serializer.copy(object)).toEqual({
    date: new Date(0),
    array: [1, 'a', true, new Date(1)],
    string: 'hello',
    number: 42,
  });
});

test('copy undefined', () => {
  expect(serializer.copy(undefined)).toEqual(undefined);
});

test('copy a date', () => {
  expect(serializer.copy(new Date(0))).toEqual(new Date(0));
});

test('copy with custom reviver', () => {
  const reviver = (key, value) => (key === 'a' ? 'x' : value);
  expect(serializer.copy({ a: 1, b: 2, c: new Date(120) }, { reviver })).toEqual({
    a: 'x',
    b: 2,
    c: new Date(120),
  });
});

test('deserializeFromString with custom reviver', () => {
  const reviver = (key, value) => (key === 'a' ? 'x' : value);
  expect(
    serializer.deserializeFromString('{ "a": 1, "b": 2, "c": {"~d": 120 } }', { reviver })
  ).toEqual({
    a: 'x',
    b: 2,
    c: new Date(120),
  });
});

test('deserialize with custom reviver', () => {
  const reviver = (key, value) => (key === 'a' ? 'x' : value);
  expect(serializer.deserialize({ a: 1, b: 2, c: { '~d': 120 } }, { reviver })).toEqual({
    a: 'x',
    b: 2,
    c: new Date(120),
  });
});

test('copy with custom replacer', () => {
  const replacer = (key, value) => (key === 'a' ? 'x' : value);
  expect(serializer.copy({ a: 1, b: 2, c: new Date(120) }, { replacer })).toEqual({
    a: 'x',
    b: 2,
    c: new Date(120),
  });
});

test('serializeToString with custom replacer', () => {
  const replacer = (key, value) => (key === 'a' ? 'x' : value);
  expect(serializer.serializeToString({ a: 1, b: 2, c: new Date(120) }, { replacer })).toEqual(
    '{"a":"x","b":2,"c":{"~d":120}}'
  );
});

test('serialize with custom replacer', () => {
  const replacer = (key, value) => (key === 'a' ? 'x' : value);
  expect(serializer.serialize({ a: 1, b: 2, c: new Date(120) }, { replacer })).toEqual({
    a: 'x',
    b: 2,
    c: { '~d': 120 },
  });
});

test('deserialize should pass invalid date through without error', () => {
  expect(serializer.copy({ '~d': 'invalid' })).toEqual({ '~d': 'invalid' });
  expect(serializer.copy([{ '~d': 'invalid' }])).toEqual([{ '~d': 'invalid' }]);
  expect(serializer.copy({ a: { '~d': 'invalid' } })).toEqual({ a: { '~d': 'invalid' } });

  expect(serializer.deserialize({ '~d': 'invalid' })).toEqual({ '~d': 'invalid' });
  expect(serializer.deserialize([{ '~d': 'invalid' }])).toEqual([{ '~d': 'invalid' }]);
  expect(serializer.deserialize({ a: { '~d': 'invalid' } })).toEqual({ a: { '~d': 'invalid' } });

  expect(serializer.deserializeFromString('{ "~d": "invalid" }')).toEqual({ '~d': 'invalid' });
  expect(serializer.deserializeFromString('[{ "~d": "invalid" }]')).toEqual([{ '~d': 'invalid' }]);
  expect(serializer.deserializeFromString('{ "a": { "~d": "invalid" } }')).toEqual({
    a: { '~d': 'invalid' },
  });
});

test('serialize isoStringDates', () => {
  expect(serializer.serialize(new Date(0), { isoStringDates: true })).toEqual({
    '~d': '1970-01-01T00:00:00.000Z',
  });
  expect(serializer.serialize({ a: new Date(0) }, { isoStringDates: true })).toEqual({
    a: { '~d': '1970-01-01T00:00:00.000Z' },
  });
  expect(serializer.serialize({ a: [new Date(0)] }, { isoStringDates: true })).toEqual({
    a: [{ '~d': '1970-01-01T00:00:00.000Z' }],
  });
});

test('serializeToString isoStringDates', () => {
  expect(serializer.serializeToString(new Date(0), { isoStringDates: true })).toEqual(
    '{ "~d": "1970-01-01T00:00:00.000Z" }'
  );
  expect(serializer.serializeToString({ a: new Date(0) }, { isoStringDates: true })).toEqual(
    '{"a":{"~d":"1970-01-01T00:00:00.000Z"}}'
  );
  expect(serializer.serializeToString({ a: [new Date(0)] }, { isoStringDates: true })).toEqual(
    '{"a":[{"~d":"1970-01-01T00:00:00.000Z"}]}'
  );
});

test('serialize convert Error to ~e', () => {
  const object = {
    a: new Error('Test error'),
  };
  const result = serializer.serialize(object);
  expect(result.a['~e'].message).toBe('Test error');
  expect(result.a['~e'].name).toBe('Error');
  expect(result.a['~e'].stack).toContain('Error: Test error');
  expect(result.a['~e'].value).toBeUndefined();
});

test('serializeToString convert Error to ~e', () => {
  const object = {
    a: new Error('Test error'),
  };
  const result = JSON.parse(serializer.serializeToString(object));
  expect(result.a['~e'].message).toBe('Test error');
  expect(result.a['~e'].name).toBe('Error');
  expect(result.a['~e'].stack).toContain('Error: Test error');
});

test('deserialize revive ~e to Error', () => {
  const object = {
    a: { '~e': { message: 'Test error', name: 'Error' } },
  };
  const result = serializer.deserialize(object);
  expect(result.a).toBeInstanceOf(Error);
  expect(result.a.message).toBe('Test error');
  expect(result.a.name).toBe('Error');
});

test('deserializeFromString revive ~e to Error', () => {
  const object = '{"a": {"~e": {"message": "Test error", "name": "Error"}}}';
  const result = serializer.deserializeFromString(object);
  expect(result.a).toBeInstanceOf(Error);
  expect(result.a.message).toBe('Test error');
  expect(result.a.name).toBe('Error');
});
test('deserialize with ~k and ~r values', () => {
  let object = {
    x: 1,
    '~k': 'a',
  };
  let res = serializer.deserialize(object);
  expect(res).toEqual({
    x: 1,
  });
  expect(res['~k']).toEqual('a');
  expect(Object.keys(res)).toEqual(['x']);
  object = {
    x: 1,
    '~r': 'a',
  };
  res = serializer.deserialize(object);
  expect(res).toEqual({
    x: 1,
  });
  expect(res['~r']).toEqual('a');
  expect(Object.keys(res)).toEqual(['x']);
});

test('serialize with ~k and ~r values', () => {
  let object = {
    x: 1,
  };
  Object.defineProperty(object, '~k', {
    value: 'a',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  let res = serializer.serialize(object);
  expect(res).toEqual({
    x: 1,
    '~k': 'a',
  });
  object = {
    x: 1,
  };
  Object.defineProperty(object, '~r', {
    value: 'a',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  res = serializer.serialize(object);
  expect(res).toEqual({
    x: 1,
    '~r': 'a',
  });
});

test('deserialize with ~k and ~r value first', () => {
  let object = {
    y: { '~d': 0, '~k': 'b' },
    '~k': 'a',
  };
  let res = serializer.deserialize(object);
  expect(res).toEqual({
    y: new Date(0),
  });
  object = {
    y: { '~d': 0, '~r': 'b' },
    '~r': 'a',
  };
  res = serializer.deserialize(object);
  expect(res).toEqual({
    y: new Date(0),
  });
});

test('deserialize with ~l values', () => {
  let object = {
    x: 1,
    '~l': 42,
  };
  let res = serializer.deserialize(object);
  expect(res).toEqual({
    x: 1,
  });
  expect(res['~l']).toEqual(42);
  expect(Object.keys(res)).toEqual(['x']);
});

test('serialize with ~l values', () => {
  let object = {
    x: 1,
  };
  Object.defineProperty(object, '~l', {
    value: 42,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  let res = serializer.serialize(object);
  expect(res).toEqual({
    x: 1,
    '~l': 42,
  });
});

test('copy preserves non-enumerable ~l values', () => {
  let object = {
    x: 1,
    nested: { y: 2 },
  };
  Object.defineProperty(object, '~l', {
    value: 10,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(object.nested, '~l', {
    value: 20,
    enumerable: false,
    writable: true,
    configurable: true,
  });

  let res = serializer.copy(object);

  // Values are preserved
  expect(res['~l']).toEqual(10);
  expect(res.nested['~l']).toEqual(20);

  // But they're non-enumerable
  expect(Object.keys(res)).toEqual(['x', 'nested']);
  expect(Object.keys(res.nested)).toEqual(['y']);
});

test('copy preserves non-enumerable ~l values on arrays', () => {
  const object = {
    x: 1,
    items: [{ id: 'a' }, { id: 'b' }],
  };
  Object.defineProperty(object, '~l', {
    value: 1,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(object.items, '~l', {
    value: 5,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(object.items[0], '~l', {
    value: 6,
    enumerable: false,
    writable: true,
    configurable: true,
  });

  const res = serializer.copy(object);

  // Values are preserved
  expect(res['~l']).toEqual(1);
  expect(res.items['~l']).toEqual(5);
  expect(res.items[0]['~l']).toEqual(6);

  // Array is still an array
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([{ id: 'a' }, { id: 'b' }]);

  // ~l is non-enumerable (not in keys)
  expect(Object.keys(res)).toEqual(['x', 'items']);
  expect(Object.keys(res.items)).toEqual(['0', '1']);
  expect(Object.keys(res.items[0])).toEqual(['id']);
});

// ~arr marker tests

test('serialize wraps array with ~l in ~arr marker', () => {
  const items = [1, 2, 3];
  Object.defineProperty(items, '~l', {
    value: 10,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.serialize(object);
  expect(res).toEqual({ items: { '~arr': [1, 2, 3], '~l': 10 } });
});

test('serialize wraps array with ~l and dates in ~arr marker', () => {
  const items = [new Date(0), new Date(100)];
  Object.defineProperty(items, '~l', {
    value: 5,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.serialize(object);
  expect(res).toEqual({ items: { '~arr': [{ '~d': 0 }, { '~d': 100 }], '~l': 5 } });
});

test('serialize does not wrap array without ~l in ~arr marker', () => {
  const object = { items: [1, 2, 3] };
  const res = serializer.serialize(object);
  expect(res).toEqual({ items: [1, 2, 3] });
});

test('deserialize restores ~arr marker to array with ~l', () => {
  const object = { items: { '~arr': [1, 2, 3], '~l': 10 } };
  const res = serializer.deserialize(object);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([1, 2, 3]);
  expect(res.items['~l']).toEqual(10);
  expect(Object.keys(res.items)).toEqual(['0', '1', '2']);
});

test('deserialize restores ~arr marker with dates', () => {
  const object = { items: { '~arr': [{ '~d': 0 }, { '~d': 100 }], '~l': 5 } };
  const res = serializer.deserialize(object);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([new Date(0), new Date(100)]);
  expect(res.items['~l']).toEqual(5);
});

test('deserialize restores ~arr marker without ~l', () => {
  const object = { items: { '~arr': [1, 2, 3] } };
  const res = serializer.deserialize(object);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([1, 2, 3]);
  expect(res.items['~l']).toBeUndefined();
});

test('deserializeFromString restores ~arr marker to array with ~l', () => {
  const str = '{"items":{"~arr":[1,2,3],"~l":10}}';
  const res = serializer.deserializeFromString(str);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([1, 2, 3]);
  expect(res.items['~l']).toEqual(10);
  expect(Object.keys(res.items)).toEqual(['0', '1', '2']);
});

test('serializeToString wraps array with ~l in ~arr marker', () => {
  const items = [1, 2, 3];
  Object.defineProperty(items, '~l', {
    value: 10,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.serializeToString(object);
  expect(res).toEqual('{"items":{"~arr":[1,2,3],"~l":10}}');
});

test('serialize and deserialize round-trip preserves ~l on nested arrays', () => {
  const inner = [{ id: 'a' }];
  Object.defineProperty(inner, '~l', {
    value: 7,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { nested: { items: inner } };
  const serialized = serializer.serialize(object);
  const deserialized = serializer.deserialize(serialized);
  expect(Array.isArray(deserialized.nested.items)).toBe(true);
  expect(deserialized.nested.items).toEqual([{ id: 'a' }]);
  expect(deserialized.nested.items['~l']).toEqual(7);
});

// Error round-trip and custom error names

test('serialize and deserialize round-trip for Error', () => {
  const object = { err: new Error('round trip') };
  const res = serializer.copy(object);
  expect(res.err).toBeInstanceOf(Error);
  expect(res.err.message).toEqual('round trip');
  expect(res.err.name).toEqual('Error');
});

test('serialize converts Error with custom name', () => {
  const err = new TypeError('bad type');
  const object = { err };
  const res = serializer.serialize(object);
  expect(res.err['~e'].name).toBe('TypeError');
  expect(res.err['~e'].message).toBe('bad type');
  expect(res.err['~e'].stack).toContain('TypeError: bad type');
  expect(res.err['~e'].value).toBeUndefined();
});

test('deserialize revives ~e with custom error name', () => {
  const object = {
    err: { '~e': { name: 'TypeError', message: 'bad type' } },
  };
  const res = serializer.deserialize(object);
  expect(res.err).toBeInstanceOf(Error);
  expect(res.err.message).toEqual('bad type');
  expect(res.err.name).toEqual('TypeError');
});

test('copy round-trip for Error with custom name preserves name', () => {
  const err = new RangeError('out of range');
  const object = { err };
  const res = serializer.copy(object);
  expect(res.err).toBeInstanceOf(Error);
  expect(res.err.message).toEqual('out of range');
  expect(res.err.name).toEqual('RangeError');
});

// ~l combined with ~k and ~r

test('serialize with ~l and ~k on same object', () => {
  const object = { x: 1 };
  Object.defineProperty(object, '~l', {
    value: 42,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(object, '~k', {
    value: 'key1',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const res = serializer.serialize(object);
  expect(res).toEqual({ x: 1, '~l': 42, '~k': 'key1' });
});

test('deserialize with ~l and ~k on same object', () => {
  const object = { x: 1, '~l': 42, '~k': 'key1' };
  const res = serializer.deserialize(object);
  expect(res).toEqual({ x: 1 });
  expect(res['~l']).toEqual(42);
  expect(res['~k']).toEqual('key1');
  expect(Object.keys(res)).toEqual(['x']);
});

test('serialize wraps array with ~k in ~arr marker', () => {
  const items = [1, 2, 3];
  Object.defineProperty(items, '~k', {
    value: 'arrKey',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.serialize(object);
  expect(res).toEqual({ items: { '~arr': [1, 2, 3], '~k': 'arrKey' } });
});

test('serialize wraps array with ~r in ~arr marker', () => {
  const items = [1, 2, 3];
  Object.defineProperty(items, '~r', {
    value: 'arrRef',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.serialize(object);
  expect(res).toEqual({ items: { '~arr': [1, 2, 3], '~r': 'arrRef' } });
});

test('serialize wraps array with ~l, ~k, and ~r in ~arr marker', () => {
  const items = [1, 2];
  Object.defineProperty(items, '~l', {
    value: 5,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(items, '~k', {
    value: 'arrKey',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(items, '~r', {
    value: 'arrRef',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.serialize(object);
  expect(res).toEqual({ items: { '~arr': [1, 2], '~l': 5, '~k': 'arrKey', '~r': 'arrRef' } });
});

test('deserialize restores ~arr marker with ~k to array', () => {
  const object = { items: { '~arr': [1, 2, 3], '~k': 'arrKey' } };
  const res = serializer.deserialize(object);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([1, 2, 3]);
  expect(res.items['~k']).toEqual('arrKey');
  expect(Object.keys(res.items)).toEqual(['0', '1', '2']);
});

test('deserialize restores ~arr marker with ~r to array', () => {
  const object = { items: { '~arr': [1, 2, 3], '~r': 'arrRef' } };
  const res = serializer.deserialize(object);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([1, 2, 3]);
  expect(res.items['~r']).toEqual('arrRef');
  expect(Object.keys(res.items)).toEqual(['0', '1', '2']);
});

test('deserialize restores ~arr marker with ~l, ~k, and ~r to array', () => {
  const object = { items: { '~arr': [1, 2], '~l': 5, '~k': 'arrKey', '~r': 'arrRef' } };
  const res = serializer.deserialize(object);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([1, 2]);
  expect(res.items['~l']).toEqual(5);
  expect(res.items['~k']).toEqual('arrKey');
  expect(res.items['~r']).toEqual('arrRef');
  expect(Object.keys(res.items)).toEqual(['0', '1']);
});

test('copy preserves ~k and ~r on arrays', () => {
  const items = [{ id: 'a' }, { id: 'b' }];
  Object.defineProperty(items, '~k', {
    value: 'arrKey',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(items, '~r', {
    value: 'arrRef',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.copy(object);
  expect(Array.isArray(res.items)).toBe(true);
  expect(res.items).toEqual([{ id: 'a' }, { id: 'b' }]);
  expect(res.items['~k']).toEqual('arrKey');
  expect(res.items['~r']).toEqual('arrRef');
  expect(Object.keys(res.items)).toEqual(['0', '1']);
});

test('copy preserves ~l, ~k, and ~r together on arrays', () => {
  const items = [1, 2];
  Object.defineProperty(items, '~l', {
    value: 5,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(items, '~k', {
    value: 'arrKey',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(items, '~r', {
    value: 'arrRef',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const object = { items };
  const res = serializer.copy(object);
  expect(res.items['~l']).toEqual(5);
  expect(res.items['~k']).toEqual('arrKey');
  expect(res.items['~r']).toEqual('arrRef');
  expect(Object.keys(res.items)).toEqual(['0', '1']);
});

test('copy preserves ~l and ~k and ~r together', () => {
  const object = { x: 1 };
  Object.defineProperty(object, '~l', {
    value: 10,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(object, '~k', {
    value: 'mykey',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(object, '~r', {
    value: 'myref',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  const res = serializer.copy(object);
  expect(res['~l']).toEqual(10);
  expect(res['~k']).toEqual('mykey');
  expect(res['~r']).toEqual('myref');
  expect(Object.keys(res)).toEqual(['x']);
});

// Lowdefy error class round-trip tests

test('copy round-trip for ConfigError preserves class and properties', () => {
  const err = new ConfigError('Invalid block', { configKey: 'key-123' });
  const res = serializer.copy({ err });
  expect(res.err).toBeInstanceOf(ConfigError);
  expect(res.err.name).toBe('ConfigError');
  expect(res.err.message).toBe('Invalid block');
  expect(res.err.configKey).toBe('key-123');
});

test('copy round-trip for OperatorError preserves class and properties', () => {
  const original = new Error('_if requires boolean');
  const err = new OperatorError(original.message, {
    cause: original,
    typeName: '_if',
    location: 'blocks.0.visible',
    configKey: 'key-456',
  });
  const res = serializer.copy({ err });
  expect(res.err).toBeInstanceOf(OperatorError);
  expect(res.err.name).toBe('OperatorError');
  expect(res.err._message).toBe('_if requires boolean');
  expect(res.err.location).toBe('blocks.0.visible');
  expect(res.err.typeName).toBe('_if');
  expect(res.err.configKey).toBe('key-456');
});

test('copy round-trip for ServiceError preserves class and properties', () => {
  const err = new ServiceError('Connection refused', {
    service: 'MongoDB',
    code: 'ECONNREFUSED',
    statusCode: 503,
  });
  const res = serializer.copy({ err });
  expect(res.err).toBeInstanceOf(ServiceError);
  expect(res.err.name).toBe('ServiceError');
  expect(res.err.service).toBe('MongoDB');
  expect(res.err.code).toBe('ECONNREFUSED');
  expect(res.err.statusCode).toBe(503);
});

test('copy round-trip for UserError preserves class and properties', () => {
  const err = new UserError('Validation failed', { blockId: 'input1', pageId: 'home' });
  const res = serializer.copy({ err });
  expect(res.err).toBeInstanceOf(UserError);
  expect(res.err.name).toBe('UserError');
  expect(res.err.message).toBe('Validation failed');
  expect(res.err.blockId).toBe('input1');
  expect(res.err.pageId).toBe('home');
});

test('copy round-trip for LowdefyInternalError preserves class', () => {
  const err = new LowdefyInternalError('Unexpected condition');
  const res = serializer.copy({ err });
  expect(res.err).toBeInstanceOf(LowdefyInternalError);
  expect(res.err.name).toBe('LowdefyInternalError');
  expect(res.err.message).toBe('Unexpected condition');
});

// extractErrorProps tests

test('extractErrorProps captures message, name, stack', () => {
  const err = new Error('test');
  const props = extractErrorProps(err);
  expect(props.message).toBe('test');
  expect(props.name).toBe('Error');
  expect(props.stack).toContain('Error: test');
});

test('extractErrorProps captures enumerable properties', () => {
  const err = new Error('test');
  err.configKey = 'key-1';
  err.typeName = '_if';
  const props = extractErrorProps(err);
  expect(props.configKey).toBe('key-1');
  expect(props.typeName).toBe('_if');
});

test('extractErrorProps captures cause when present', () => {
  const cause = new Error('root cause');
  const err = new Error('wrapper', { cause });
  const props = extractErrorProps(err);
  expect(props.cause).toBe(cause);
});

test('extractErrorProps returns falsy input as-is', () => {
  expect(extractErrorProps(null)).toBeNull();
  expect(extractErrorProps(undefined)).toBeUndefined();
});
