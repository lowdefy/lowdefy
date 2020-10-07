/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

const config = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const user = { firstName: 'Name' };
const args = {};

test('_config in object', () => {
  const input = { a: { _config: 'string' } };
  const parser = new NodeParser({ config, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Some String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_config full config', () => {
  const input = { _config: true };
  const parser = new NodeParser({ config, user });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(config);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

// test('_config replace key arrayIndices', () => {
//   const input = { a: { _config: 'arr.$.a' } };
//   const parser = new NodeParser({
//     config,
//     user,
//     arrayIndices: [1],
//   });
//   const res = parser.parse({ input, args, location: 'locationId' });
//   expect(res.output).toEqual({
//     a: 'a2',
//   });
//   expect(res.errors).toMatchInlineSnapshot(`Array []`);
// });

test('_config param object key', () => {
  const input = {
    _config: {
      key: 'string',
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('Some String');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_config param object all', () => {
  const input = {
    _config: {
      all: true,
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(config);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_config param object all and key', () => {
  const input = {
    _config: {
      all: true,
      key: 'string',
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(config);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_config param object invalid', () => {
  const input = {
    _config: {
      other: true,
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _config.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_config param array', () => {
  const input = {
    _config: ['string'],
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _config params must be of type string or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_config param object with string default', () => {
  const input = {
    _config: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_config param object with zero default', () => {
  const input = {
    _config: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_config param object with false default', () => {
  const input = {
    _config: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_config param object with no default', () => {
  const input = {
    _config: {
      key: 'notFound',
    },
  };
  const parser = new NodeParser({
    config,
    user,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
