/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const user = { firstName: 'Name' };
const args = {};

test('_state in object', () => {
  const input = { a: { _state: 'string' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Some String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state full state', () => {
  const input = { _state: true };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(state);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state null', () => {
  const input = { _state: null };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _state params must be of type string or object. Received: null at locationId.],
    ]
  `);
});

test('_state param object key', () => {
  const input = {
    _state: {
      key: 'string',
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('Some String');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state param object all', () => {
  const input = {
    _state: {
      all: true,
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(state);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state param object all and key', () => {
  const input = {
    _state: {
      all: true,
      key: 'string',
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(state);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state param object invalid', () => {
  const input = {
    _state: {
      other: true,
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _state.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_state param array', () => {
  const input = {
    _state: ['string'],
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _state params must be of type string or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_state param object with string default', () => {
  const input = {
    _state: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state param object with zero default', () => {
  const input = {
    _state: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state param object with false default', () => {
  const input = {
    _state: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_state param object with no default', () => {
  const input = {
    _state: {
      key: 'notFound',
    },
  };
  const parser = new NodeParser({
    state,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
