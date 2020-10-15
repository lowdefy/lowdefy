import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const args = {};

test('_date now', () => {
  const RealDate = Date;
  const constantDate = new Date();
  global.Date = class extends Date {
    constructor() {
      super();
      return constantDate;
    }
  };
  const input = { _date: 'now' };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(constantDate);
  global.Date = RealDate;
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date from string', () => {
  const input = { _date: '2018-01-01T12:00:00.000Z' };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(new Date('2018-01-01T12:00:00.000Z'));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date short format', () => {
  const input = { _date: '2018-01-01' };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(new Date('2018-01-01'));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date from unix timestamp', () => {
  const input = { _date: 1569579992 };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(new Date(1569579992));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_date null', () => {
  const input = { _date: null };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date input must be of type string or integer. Received: null at locationId.],
    ]
  `);
});

test('_date invalid operator', () => {
  const input = { _date: {} };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date input must be of type string or integer. Received: {} at locationId.],
    ]
  `);
});

test('_date invalid string', () => {
  const input = { _date: 'abc' };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date could not resolve as a valid javascript date. Received: "abc" at locationId.],
    ]
  `);
});

test('_date invalid float', () => {
  const input = { _date: 1.3 };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _date input must be of type string or integer. Received: 1.3 at locationId.],
    ]
  `);
});

test('_date negative int', () => {
  const input = { _date: -1000 };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual(new Date(-1000));
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
