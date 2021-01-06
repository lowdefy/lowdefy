import NodeParser from '../../src/nodeParser';

const state = {
  arr: [{ a: 'a1' }, { a: 'a2' }],
  dateArr: [new Date(0), new Date(1)],
  dateObject: { a: new Date(0) },
};
const args = {};

test('_yaml_stringify string', () => {
  const input = { a: { _yaml_stringify: 'firstName' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `firstName
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify number', () => {
  const input = { a: { _yaml_stringify: 1 } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `1
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify boolean true', () => {
  const input = { a: { _yaml_stringify: true } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `true
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify boolean false', () => {
  const input = { a: { _yaml_stringify: false } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `false
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify null', () => {
  const input = { a: { _yaml_stringify: null } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `null
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify undefined in object', () => {
  const input = { a: { _yaml_stringify: { b: undefined } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `{}
`,
  });
  expect(res.errors).toEqual([]);
});

// This is unexpected but happens due to the way JSON stringify works
test('_yaml_stringify undefined ', () => {
  const input = { _yaml_stringify: undefined };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({}); // expected 'undefined' ?
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify date', () => {
  const input = { a: { _yaml_stringify: new Date(0) } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `_date: '1970-01-01T00:00:00.000Z'
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify array', () => {
  const input = { a: { _yaml_stringify: state.arr } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `- a: a1
- a: a2
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify date array', () => {
  const input = { a: { _yaml_stringify: state.dateArr } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `- _date: '1970-01-01T00:00:00.000Z'
- _date: '1970-01-01T00:00:00.001Z'
`,
  });
  expect(res.errors).toEqual([]);
});

test('_yaml_stringify date object', () => {
  const input = { a: { _yaml_stringify: state.dateObject } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `a:
  _date: '1970-01-01T00:00:00.000Z'
`,
  });
  expect(res.errors).toEqual([]);
});
