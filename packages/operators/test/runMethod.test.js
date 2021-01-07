import runMethod from '../src/runMethod';

const location = 'locationId';
const operator = '_op';
const Fn = {
  method: (a) => a,
  methods: (a, b, c) => a + b + c,
  property: 'propertyValue',
};
const allowedMethods = ['method', 'methods'];
const allowedProperties = ['property'];

test('evaluate method', () => {
  expect(
    runMethod({
      allowedMethods,
      allowedProperties,
      Fn,
      location,
      method: 'method',
      operator,
      params: ['a'],
    })
  ).toEqual('a');
});

test('evaluate method, spread properties', () => {
  expect(
    runMethod({
      allowedMethods,
      allowedProperties,
      Fn,
      location,
      method: 'methods',
      operator,
      params: [1, 2, 3],
    })
  ).toEqual(6);
});

test('not an allowed method', () => {
  expect(() =>
    runMethod({
      allowedMethods,
      allowedProperties,
      Fn,
      location,
      method: 'x',
      operator,
      params: [1, 2, 3],
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following: method, methods. Received: {"_op.x":[1,2,3]} at locationId.'
  );
});

test('get property', () => {
  expect(
    runMethod({
      allowedMethods,
      allowedProperties,
      Fn,
      location,
      operator,
      params: 'property',
    })
  ).toEqual('propertyValue');
});

test('not an allowed property', () => {
  expect(() =>
    runMethod({
      allowedMethods,
      allowedProperties,
      Fn,
      location,
      operator,
      params: 'x',
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following values: property. Received: {"_op":"x"} at locationId.'
  );
});

test('method operator not called with a method', () => {
  expect(() =>
    runMethod({
      allowedMethods,
      allowedProperties,
      Fn,
      location,
      operator,
      params: 123,
    })
  ).toThrow(
    'Operator Error: _op must be called with one of the following properties: property. Or Methods: method, methods. Received: 123 at locationId.'
  );
});
