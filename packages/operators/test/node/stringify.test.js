import NodeParser from '../../src/nodeParser';

const state = {
  arr: [{ a: 'a1' }, { a: 'a2' }],
  dateArr: [new Date(0), new Date(1)],
  dateObject: { a: new Date(0) },
};
const args = {};

test('_stringify string', () => {
  const input = { a: { _stringify: 'firstName' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: '"firstName"',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify number', () => {
  const input = { a: { _stringify: 1 } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: '1',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify boolean true', () => {
  const input = { a: { _stringify: true } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'true',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify boolean false', () => {
  const input = { a: { _stringify: false } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'false',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify null', () => {
  const input = { a: { _stringify: null } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'null',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify undefined in object', () => {
  const input = { a: { _stringify: { b: undefined } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: '{}',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

// This is unexpected but happens due to the way JSON stringify works
test('_stringify undefined', () => {
  const input = { _stringify: undefined };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({}); // expected 'undefined' ?
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify date', () => {
  const input = { a: { _stringify: new Date(0) } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toMatchInlineSnapshot(`
    Object {
      "a": "{ \\"_date\\": \\"1970-01-01T00:00:00.000Z\\" }",
    }
  `);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify array', () => {
  const input = { a: { _stringify: state.arr } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toMatchInlineSnapshot(`
    Object {
      "a": "[
      {
        \\"a\\": \\"a1\\"
      },
      {
        \\"a\\": \\"a2\\"
      }
    ]",
    }
  `);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify date array', () => {
  const input = { a: { _stringify: state.dateArr } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toMatchInlineSnapshot(`
    Object {
      "a": "[
      {
        \\"_date\\": \\"1970-01-01T00:00:00.000Z\\"
      },
      {
        \\"_date\\": \\"1970-01-01T00:00:00.001Z\\"
      }
    ]",
    }
  `);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_stringify date object', () => {
  const input = { a: { _stringify: state.dateObject } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toMatchInlineSnapshot(`
    Object {
      "a": "{
      \\"a\\": {
        \\"_date\\": \\"1970-01-01T00:00:00.000Z\\"
      }
    }",
    }
  `);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
