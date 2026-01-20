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

test('_jsonata basic expression', () => {
  expect(
    jsonata({
      params: { on: { a: 1, b: 2 }, expr: 'a + b' },
      location: 'locationId',
    })
  ).toEqual(3);
});

test('_jsonata string concatenation', () => {
  expect(
    jsonata({
      params: { on: { firstName: 'John', lastName: 'Doe' }, expr: 'firstName & " " & lastName' },
      location: 'locationId',
    })
  ).toEqual('John Doe');
});

test('_jsonata array access', () => {
  expect(
    jsonata({
      params: { on: { items: [1, 2, 3, 4, 5] }, expr: 'items[0]' },
      location: 'locationId',
    })
  ).toEqual(1);
});

test('_jsonata array filter', () => {
  expect(
    jsonata({
      params: { on: { items: [1, 2, 3, 4, 5] }, expr: 'items[$ > 3]' },
      location: 'locationId',
    })
  ).toEqual([4, 5]);
});

test('_jsonata array map', () => {
  expect(
    jsonata({
      params: {
        on: { items: [{ name: 'Alice' }, { name: 'Bob' }] },
        expr: 'items.name',
      },
      location: 'locationId',
    })
  ).toEqual(['Alice', 'Bob']);
});

test('_jsonata with aggregation', () => {
  expect(
    jsonata({
      params: { on: { items: [1, 2, 3, 4, 5] }, expr: '$sum(items)' },
      location: 'locationId',
    })
  ).toEqual(15);
});

test('_jsonata nested object access', () => {
  expect(
    jsonata({
      params: {
        on: { user: { profile: { name: 'Alice' } } },
        expr: 'user.profile.name',
      },
      location: 'locationId',
    })
  ).toEqual('Alice');
});

test('_jsonata with bindings', () => {
  expect(
    jsonata({
      params: {
        on: { price: 100 },
        expr: 'price * taxRate',
        bindings: { taxRate: 1.2 },
      },
      location: 'locationId',
    })
  ).toEqual(120);
});

test('_jsonata null data defaults to empty object', () => {
  expect(
    jsonata({
      params: { on: null, expr: '$' },
      location: 'locationId',
    })
  ).toEqual({});
});

test('_jsonata object transformation', () => {
  expect(
    jsonata({
      params: {
        on: { user: { firstName: 'John', lastName: 'Doe', age: 30 } },
        expr: '{ "fullName": user.firstName & " " & user.lastName, "age": user.age }',
      },
      location: 'locationId',
    })
  ).toEqual({ fullName: 'John Doe', age: 30 });
});

test('_jsonata array transformation', () => {
  const result = jsonata({
    params: {
      on: {
        orders: [
          { id: 1, amount: 100 },
          { id: 2, amount: 200 },
        ],
      },
      expr: 'orders.{ "orderId": id, "total": amount * 1.1 }',
    },
    location: 'locationId',
  });
  expect(result).toHaveLength(2);
  expect(result[0].orderId).toBe(1);
  expect(result[0].total).toBeCloseTo(110, 5);
  expect(result[1].orderId).toBe(2);
  expect(result[1].total).toBeCloseTo(220, 5);
});

test('_jsonata non-string expression throws', () => {
  expect(() =>
    jsonata({
      params: { on: { a: 1 }, expr: 123 },
      location: 'locationId',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_jsonata.evaluate - Expression must be a string."`
  );
});

test('_jsonata invalid expression throws', () => {
  expect(() =>
    jsonata({
      params: { on: { a: 1 }, expr: 'invalid syntax (((' },
      location: 'locationId',
    })
  ).toThrow(/JSONata evaluation error/);
});

test('_jsonata conditional expression', () => {
  expect(
    jsonata({
      params: {
        on: { temperature: 25 },
        expr: 'temperature > 20 ? "warm" : "cold"',
      },
      location: 'locationId',
    })
  ).toEqual('warm');
});

test('_jsonata with $count function', () => {
  expect(
    jsonata({
      params: {
        on: { items: ['a', 'b', 'c', 'd'] },
        expr: '$count(items)',
      },
      location: 'locationId',
    })
  ).toEqual(4);
});

test('_jsonata complex object construction', () => {
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
    })
  ).toEqual({ user: 'Jane Smith', totalSpent: 300 });
});

test('_jsonata array params syntax', () => {
  expect(
    jsonata({
      params: [{ a: 5, b: 3 }, 'a + b'],
      location: 'locationId',
    })
  ).toEqual(8);
});

test('_jsonata array params with bindings', () => {
  expect(
    jsonata({
      params: [{ price: 100 }, 'price * taxRate', { taxRate: 1.5 }],
      location: 'locationId',
    })
  ).toEqual(150);
});
