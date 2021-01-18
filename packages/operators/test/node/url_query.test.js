import NodeParser from '../../src/nodeParser';

const urlQuery = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const args = {};

test('_url_query in object', () => {
  const input = { a: { _url_query: 'string' } };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'Some String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query full urlQuery', () => {
  const input = { _url_query: true };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(urlQuery);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query null', () => {
  const input = { _url_query: null };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _url_query params must be of type string or object. Received: null at locationId.],
    ]
  `);
});

test('_url_query param object key', () => {
  const input = {
    _url_query: {
      key: 'string',
    },
  };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('Some String');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query param object all', () => {
  const input = {
    _url_query: {
      all: true,
    },
  };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(urlQuery);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query param object all and key', () => {
  const input = {
    _url_query: {
      all: true,
      key: 'string',
    },
  };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(urlQuery);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query param object invalid', () => {
  const input = {
    _url_query: {
      other: true,
    },
  };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _url_query.key must be of type string. Received: {"other":true} at locationId.],
    ]
  `);
});

test('_url_query param array', () => {
  const input = {
    _url_query: ['string'],
  };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _url_query params must be of type string or object. Received: ["string"] at locationId.],
    ]
  `);
});

test('_url_query param object with string default', () => {
  const input = {
    _url_query: {
      key: 'notFound',
      default: 'defaultValue',
    },
  };
  const parser = new NodeParser({
    urlQuery,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual('defaultValue');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query param object with zero default', () => {
  const input = {
    _url_query: {
      key: 'notFound',
      default: 0,
    },
  };
  const parser = new NodeParser({
    urlQuery,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(0);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query param object with false default', () => {
  const input = {
    _url_query: {
      key: 'notFound',
      default: false,
    },
  };
  const parser = new NodeParser({
    urlQuery,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query param object with no default', () => {
  const input = {
    _url_query: {
      key: 'notFound',
    },
  };
  const parser = new NodeParser({
    urlQuery,
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query replace key arrayIndices', () => {
  const input = { a: { _url_query: 'arr.$.a' } };
  const parser = new NodeParser({
    urlQuery,
    arrayIndices: [1],
  });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'a2',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_url_query with contextId in node environment', () => {
  const input = {
    _url_query: {
      all: true,
      contextId: 'other',
    },
  };
  const parser = new NodeParser({ urlQuery });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: Accessing a context using contextId is only available in a client environment. Received: {"all":true,"contextId":"other"} at locationId.],
    ]
  `);
});
