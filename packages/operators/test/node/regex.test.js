import NodeParser from '../../src/nodeParser';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const args = {};

test('_regex with on, pass', () => {
  const input = { _regex: { pattern: '^a$', on: 'a' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_regex with on, fail', () => {
  const input = { _regex: { pattern: '^a$', on: 'b' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_regex with key, pass', () => {
  const input = { _regex: { pattern: '^Some String$', key: 'string' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_regex with key, fail', () => {
  const input = { _regex: { pattern: '^a$', key: 'string' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_regex with null on', () => {
  const input = { _regex: { pattern: '^a$', on: null } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_regex with nonexistent key', () => {
  const input = { _regex: { pattern: '^a$', key: 'notThere' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(false);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_regex with nonexistent key', () => {
  const input = { _regex: { pattern: '^a$', key: null } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _regex.key must be a string. Received: {"pattern":"^a$","key":null} at locationId.],
    ]
  `);
});

test('_regex null', () => {
  const input = { _regex: null };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _regex.pattern must be a string. Received: null at locationId.],
    ]
  `);
});

test('_regex with non-string on', () => {
  const input = { _regex: { pattern: '^a$', on: 5 } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _regex.on must be a string. Received: {"pattern":"^a$","on":5} at locationId.],
    ]
  `);
});

test('_regex flags', () => {
  const input = { _regex: { pattern: 'a', on: 'A', flags: 'i' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(true);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_regex invalid flags', () => {
  const input = { _regex: { pattern: 'a', on: 'a', flags: 1 } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _regex failed to execute RegExp.test. Received: {"pattern":"a","on":"a","flags":1} at locationId.],
    ]
  `);
});
