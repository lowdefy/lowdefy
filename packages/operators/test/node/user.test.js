import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const user = { firstName: 'Name' };
const args = {};

test('_user in object', () => {
  const input = { a: { _user: 'firstName' } };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Name',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user full user', () => {
  const input = { _user: true };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(user);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user null', () => {
  const input = { _user: null };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _user params must be of type string or object. Received: null at locationId.],
    ]
  `);
});

test('_user param object key', () => {
  const input = {
    _user: {
      key: 'firstName',
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('Name');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user param object all', () => {
  const input = {
    _user: {
      all: true,
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(user);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user param object all and key', () => {
  const input = {
    _user: {
      all: true,
      key: 'firstName',
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(user);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user param object invalid', () => {
  const input = {
    _user: {
      other: true,
    },
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _user.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_user param array', () => {
  const input = {
    _user: ['firstName'],
  };
  const parser = new NodeParser({ state, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _user params must be of type string or object. Received: ["firstName"] at locationId.],
    ]
  `);
});

test('_user param object with string default', () => {
  const input = {
    _user: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new NodeParser({
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user param object with zero default', () => {
  const input = {
    _user: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new NodeParser({
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user param object with false default', () => {
  const input = {
    _user: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new NodeParser({
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_user param object with no default', () => {
  const input = {
    _user: {
      key: 'notFound',
    },
  };
  const parser = new NodeParser({
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
