import runClass from '../src/runClass';

const location = 'locationId';
const operator = '_op';
const Cls = {
  double: (a) => a * 2,
  add: (a, b, c) => a + b + c,
  err: () => {
    throw new Error('Cls error.');
  },
  constant: 42,
};
const allowedMethods = ['double', 'add', 'err'];
const allowedProperties = ['constant'];

test('evaluate method', () => {
  expect(
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      method: 'double',
      operator,
      params: [2],
    })
  ).toEqual(4);
});

test('evaluate method, spread properties', () => {
  expect(
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      method: 'add',
      operator,
      params: [1, 2, 3],
    })
  ).toEqual(6);
});

test('not an allowed method', () => {
  expect(() =>
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      method: 'x',
      operator,
      params: [1, 2, 3],
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _op must be called with one of the following: double, add, err. Received: {\\"_op.x\\":[1,2,3]} at locationId."`
  );
});

test('get property', () => {
  expect(
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      operator,
      params: 'constant',
    })
  ).toEqual(42);
});

test('not an allowed property', () => {
  expect(() =>
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      operator,
      params: 'x',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _op must be called with one of the following values: constant. Received: {\\"_op\\":\\"x\\"} at locationId."`
  );
});

test('method operator not called with a method', () => {
  expect(() =>
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      operator,
      params: 123,
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _op must be called with one of the following properties: constant; or methods: double, add, err. Received: 123 at locationId."`
  );
});

test('method Class error', () => {
  expect(() =>
    runClass({
      allowedMethods,
      allowedProperties,
      Cls,
      location,
      operator,
      method: 'err',
      params: ['a'],
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _op.err - Cls error. Received: {\\"_op.err\\":[\\"a\\"]} at locationId."`
  );
});
