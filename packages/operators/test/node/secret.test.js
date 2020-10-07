/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

const secrets = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const user = { firstName: 'Name' };
const args = {};

test('_secret in object', () => {
  const input = { a: { _secret: 'string' } };
  const parser = new NodeParser({ secrets, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Some String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret full secrets', () => {
  const input = { _secret: true };
  const parser = new NodeParser({ secrets, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(secrets);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret null', () => {
  const input = { _secret: null };
  const parser = new NodeParser({ secrets, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _secret params must be of type string or object. Received: null at locationId.],
    ]
  `);
});

test('_secret param object key', () => {
  const input = {
    _secret: {
      key: 'string',
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('Some String');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret param object all', () => {
  const input = {
    _secret: {
      all: true,
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(secrets);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret param object all and key', () => {
  const input = {
    _secret: {
      all: true,
      key: 'string',
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(secrets);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret param object invalid', () => {
  const input = {
    _secret: {
      other: true,
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _secret.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_secret param array', () => {
  const input = {
    _secret: ['string'],
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _secret params must be of type string or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_secret param object with string default', () => {
  const input = {
    _secret: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret param object with zero default', () => {
  const input = {
    _secret: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret param object with false default', () => {
  const input = {
    _secret: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_secret param object with no default', () => {
  const input = {
    _secret: {
      key: 'notFound',
    },
  };
  const parser = new NodeParser({
    secrets,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
