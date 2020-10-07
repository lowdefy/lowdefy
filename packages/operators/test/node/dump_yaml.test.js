import NodeParser from '../../src/nodeParser';

const state = {
  arr: [{ a: 'a1' }, { a: 'a2' }],
  dateArr: [new Date(0), new Date(1)],
  dateObject: { a: new Date(0) },
};
const args = {};

test('_dump_yaml string', () => {
  const input = { a: { _dump_yaml: 'firstName' } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `firstName
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml number', () => {
  const input = { a: { _dump_yaml: 1 } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `1
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml boolean true', () => {
  const input = { a: { _dump_yaml: true } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `true
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml boolean false', () => {
  const input = { a: { _dump_yaml: false } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `false
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml null', () => {
  const input = { a: { _dump_yaml: null } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `null
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml undefined in object', () => {
  const input = { a: { _dump_yaml: { b: undefined } } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `{}
`,
  });
  expect(res.errors).toEqual([]);
});

// This is unexpected but happens due to the way JSON stringify works
test('_dump_yaml undefined ', () => {
  const input = { _dump_yaml: undefined };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({}); // expected 'undefined' ?
  expect(res.errors).toEqual([]);
});

test('_dump_yaml date', () => {
  const input = { a: { _dump_yaml: new Date(0) } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `_date: '1970-01-01T00:00:00.000Z'
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml array', () => {
  const input = { a: { _dump_yaml: state.arr } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `- a: a1
- a: a2
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml date array', () => {
  const input = { a: { _dump_yaml: state.dateArr } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `- _date: '1970-01-01T00:00:00.000Z'
- _date: '1970-01-01T00:00:00.001Z'
`,
  });
  expect(res.errors).toEqual([]);
});

test('_dump_yaml date object', () => {
  const input = { a: { _dump_yaml: state.dateObject } };
  const parser = new NodeParser({ state });
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: `a:
  _date: '1970-01-01T00:00:00.000Z'
`,
  });
  expect(res.errors).toEqual([]);
});
