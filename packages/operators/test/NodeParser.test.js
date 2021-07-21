/*
  Copyright 2020-2021 Lowdefy, Inc

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

/* eslint-disable max-classes-per-file */
import NodeParser from '../src/nodeParser';

const state = {
  string: 'Some String',
};

test('parse input undefined', async () => {
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({});
  expect(res.output).toEqual();
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse object', async () => {
  const input = { a: { _state: 'string' } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({ a: 'Some String' });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse array', async () => {
  const input = [{ _state: 'string' }];
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual(['Some String']);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse string', async () => {
  const input = 'string';
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe('string');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse number', async () => {
  const input = 42;
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(42);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse true', async () => {
  const input = true;
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse false', async () => {
  const input = false;
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse null', async () => {
  const input = null;
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse undefined', async () => {
  const input = undefined;
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(undefined);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('operator input with more than one key is ignored.', async () => {
  const input = { a: { _state: 'string', key: 'value' } };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({ a: { _state: 'string', key: 'value' } });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse event not an object', async () => {
  const input = { _state: 'string' };
  const parser = new NodeParser({ state });
  await parser.init();
  expect(() => parser.parse({ input, event: 'String' })).toThrow(
    'Operator parser event must be a object.'
  );
});

test('parse args not an array', async () => {
  const input = { _state: 'string' };
  const parser = new NodeParser({ state });
  await parser.init();
  expect(() => parser.parse({ input, args: 'String' })).toThrow(
    'Operator parser args must be an array.'
  );
});

test('parse location not a string', async () => {
  const input = { _state: 'string' };
  const parser = new NodeParser({ state });
  await parser.init();
  expect(() => parser.parse({ input, location: true })).toThrow(
    'Operator parser location must be a string.'
  );
});

test('parse js dates', async () => {
  const input = { a: new Date(1), b: [new Date(2)] };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual({ a: new Date(1), b: [new Date(2)] });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('parse js dates, do not modify input', async () => {
  const input = { a: new Date(1) };
  const parser = new NodeParser({ state });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId' });
  expect(input).toEqual({ a: new Date(1) });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
describe('parse operators', () => {
  test('parse _base64.encode operator', async () => {
    const input = { a: { '_base64.encode': 'A string value' } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 'QSBzdHJpbmcgdmFsdWU=' });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _base64.decode operator', async () => {
    const input = { a: { '_base64.decode': 'QSBzdHJpbmcgdmFsdWU=' } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 'A string value' });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _uri.encode operator', async () => {
    const input = { a: { '_uri.encode': 'ABC abc 123' } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 'ABC%20abc%20123' });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _uri.decode operator', async () => {
    const input = { a: { '_uri.decode': 'ABC%20abc%20123' } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 'ABC abc 123' });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _lt operator', async () => {
    const input = { a: { _lt: [4, 5] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: true });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _lte operator', async () => {
    const input = { a: { _lte: [5, 5] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: true });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _gt operator', async () => {
    const input = { a: { _gt: [5, 3] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: true });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _gte operator', async () => {
    const input = { a: { _gte: [5, 5] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: true });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _if_none operator', async () => {
    const input = { a: { _if_none: [null, 'default'] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 'default' });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _random operator', async () => {
    const mathRandomFn = Math.random;
    Math.random = () => 0.5678;
    const input = { a: { _random: 'string' } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 'kfv9yqdp' });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
    Math.random = mathRandomFn;
  });

  test('parse _uuid operator', async () => {
    const input = { a: { _uuid: true } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output.a.length).toEqual(36);
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _math operator', async () => {
    const input = { a: { '_math.min': [9, 4, 2] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 2 });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _sum operator', async () => {
    const input = { a: { _sum: [1, 1] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 2 });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _product operator', async () => {
    const input = { a: { _product: [2, -3] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: -6 });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _subtract operator', async () => {
    const input = { a: { _subtract: [2, -3] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 5 });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _divide operator', async () => {
    const input = { a: { _divide: [2, 4] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 0.5 });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _array operator', async () => {
    const input = { a: { '_array.length': [2, 4] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 2 });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _object operator', async () => {
    const input = { a: { '_object.keys': { a: 1, b: 2 } } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: ['a', 'b'] });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _string operator', async () => {
    const input = { a: { '_string.concat': ['a new ', 'string'] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ a: 'a new string' });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('_json.stringify then _json.parse', async () => {
    const value = {
      a: [
        { b: 1, c: false, d: new Date(0) },
        { b: 2, c: true, d: new Date(1) },
      ],
      e: 'null',
      f: 'undefined',
      g: 0,
    };
    const input = { x: { '_json.parse': { '_json.stringify': [value] } } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ x: value });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('_json.stringify then _json.parse date', async () => {
    const value = new Date();
    const input = { '_json.parse': { '_json.stringify': [value] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual(value);
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('_yaml.stringify then _yaml.parse', async () => {
    const value = {
      a: [
        { b: 1, c: false, d: new Date(0) },
        { b: 2, c: true, d: new Date(1) },
      ],
      e: 'null',
      f: 'undefined',
      g: 0,
    };
    const input = { x: { '_yaml.parse': { '_yaml.stringify': [value] } } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual({ x: value });
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('_yaml.stringify then _yaml.parse date', async () => {
    const value = new Date();
    const input = { '_yaml.parse': { '_yaml.stringify': [value] } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual(value);
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _mql operator', async () => {
    const input = { '_mql.test': { on: { _state: true }, test: { string: 'Some String' } } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual(true);
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _diff operator', async () => {
    const input = { '_diff.deep': { rhs: { a: 1 }, lhs: { b: 2 } } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual([
      { kind: 'D', lhs: 2, path: ['b'] },
      { kind: 'N', path: ['a'], rhs: 1 },
    ]);
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _global operator', async () => {
    const input = { _global: 'key' };
    const parser = new NodeParser({ lowdefyGlobal: { key: 'value' } });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('value');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _input operator', async () => {
    const input = { _input: 'key' };
    const parser = new NodeParser({ input: { key: 'value' } });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('value');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _secret operator', async () => {
    const input = { _secret: 'key' };
    const parser = new NodeParser({ secrets: { key: 'value' } });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('value');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _state operator', async () => {
    const input = { _state: 'key' };
    const parser = new NodeParser({ state: { key: 'value' } });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('value');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _url_query operator', async () => {
    const input = { _url_query: 'key' };
    const parser = new NodeParser({ urlQuery: { key: 'value' } });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('value');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _user operator', async () => {
    const input = { _user: 'name' };
    const parser = new NodeParser({ user: { name: 'user' } });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('user');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _get operator', async () => {
    const input = { _get: { key: 'key', from: { key: 'value' } } };
    const parser = new NodeParser({});
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('value');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _function operator', async () => {
    const input = { _function: { state: { __state: 'key' }, args: { __args: true } } };
    const parser = new NodeParser({ state: { key: 'value' } });
    await parser.init();
    const { output, errors } = parser.parse({ input, location: 'locationId' });
    expect(output).toBeInstanceOf(Function);
    expect(output(1, 2)).toEqual({ state: 'value', args: [1, 2] });
    expect(errors).toEqual([]);
  });

  test('parse _index operator', async () => {
    const input = { _index: 0 };
    const parser = new NodeParser({ input: { key: 'value' }, arrayIndices: [3, 2] });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual(3);
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });

  test('parse _change_case operator', async () => {
    const input = { '_change_case.camelCase': { on: 'test string' } };
    const parser = new NodeParser({ state });
    await parser.init();
    const res = parser.parse({ input, location: 'locationId' });
    expect(res.output).toEqual('testString');
    expect(res.errors).toMatchInlineSnapshot(`Array []`);
  });
});
