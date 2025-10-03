/*
  Copyright 2020-2024 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import jsonata from './jsonata.js';

test('_jsonata.evaluate basic expression', () => {
  expect(
    jsonata({
      params: { on: { a: 1, b: 2 }, expr: 'a + b' },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual(3);
});

test('_jsonata.evaluate string concatenation', () => {
  expect(
    jsonata({
      params: { on: { firstName: 'John', lastName: 'Doe' }, expr: 'firstName & " " & lastName' },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual('John Doe');
});

test('_jsonata.evaluate array access', () => {
  expect(
    jsonata({
      params: { on: { items: [1, 2, 3, 4, 5] }, expr: 'items[0]' },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual(1);
});

test('_jsonata.evaluate array filter', () => {
  expect(
    jsonata({
      params: { on: { items: [1, 2, 3, 4, 5] }, expr: 'items[$ > 3]' },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual([4, 5]);
});

test('_jsonata.evaluate array map', () => {
  expect(
    jsonata({
      params: {
        on: { items: [{ name: 'Alice' }, { name: 'Bob' }] },
        expr: 'items.name',
      },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual(['Alice', 'Bob']);
});

test('_jsonata.evaluate with aggregation', () => {
  expect(
    jsonata({
      params: { on: { items: [1, 2, 3, 4, 5] }, expr: '$sum(items)' },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual(15);
});

test('_jsonata.evaluate nested object access', () => {
  expect(
    jsonata({
      params: {
        on: { user: { profile: { name: 'Alice' } } },
        expr: 'user.profile.name',
      },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual('Alice');
});

test('_jsonata.evaluate with bindings', () => {
  expect(
    jsonata({
      params: {
        on: { price: 100 },
        expr: 'price * taxRate',
        bindings: { taxRate: 1.2 },
      },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual(120);
});

test('_jsonata.evaluate null data defaults to empty object', () => {
  expect(
    jsonata({
      params: { on: null, expr: '$' },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual({});
});

test('_jsonata.transform basic transformation', () => {
  expect(
    jsonata({
      params: {
        on: { user: { firstName: 'John', lastName: 'Doe', age: 30 } },
        expr: '{ "fullName": user.firstName & " " & user.lastName, "age": user.age }',
      },
      location: 'locationId',
      methodName: 'transform',
    })
  ).toEqual({ fullName: 'John Doe', age: 30 });
});

test('_jsonata.transform array transformation', () => {
  const result = jsonata({
    params: {
      on: { orders: [{ id: 1, amount: 100 }, { id: 2, amount: 200 }] },
      expr: 'orders.{ "orderId": id, "total": amount * 1.1 }',
    },
    location: 'locationId',
    methodName: 'transform',
  });
  expect(result).toHaveLength(2);
  expect(result[0].orderId).toBe(1);
  expect(result[0].total).toBeCloseTo(110, 5);
  expect(result[1].orderId).toBe(2);
  expect(result[1].total).toBeCloseTo(220, 5);
});

test('_jsonata.evaluate non-string expression throws', () => {
  expect(() =>
    jsonata({
      params: { on: { a: 1 }, expr: 123 },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _jsonata.evaluate - Expression must be a string. Received: {\\"_jsonata.evaluate\\":{\\"on\\":{\\"a\\":1},\\"expr\\":123}} at locationId."`
  );
});

test('_jsonata.evaluate invalid expression throws', () => {
  expect(() =>
    jsonata({
      params: { on: { a: 1 }, expr: 'invalid syntax (((' },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toThrow(/JSONata evaluation error/);
});

test('_jsonata.evaluate array params', () => {
  expect(
    jsonata({
      params: [{ a: 1, b: 2 }, 'a + b'],
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual(3);
});

test('_jsonata.evaluate conditional expression', () => {
  expect(
    jsonata({
      params: {
        on: { temperature: 25 },
        expr: 'temperature > 20 ? "warm" : "cold"',
      },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual('warm');
});

test('_jsonata.evaluate with $count function', () => {
  expect(
    jsonata({
      params: {
        on: { items: ['a', 'b', 'c', 'd'] },
        expr: '$count(items)',
      },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual(4);
});

test('_jsonata.evaluate complex object construction', () => {
  expect(
    jsonata({
      params: {
        on: {
          user: { firstName: 'Jane', lastName: 'Smith' },
          orders: [{ total: 100 }, { total: 200 }],
        },
        expr: '{ "user": user.firstName & " " & user.lastName, "totalSpent": $sum(orders.total) }',
      },
      location: 'locationId',
      methodName: 'evaluate',
    })
  ).toEqual({ user: 'Jane Smith', totalSpent: 300 });
});
