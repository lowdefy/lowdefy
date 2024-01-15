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

import json from './json.js';

test('_json.parse string unquoted', () => {
  expect(() => json({ params: 'firstName', location: 'locationId', methodName: 'parse' })).toThrow(
    'Operator Error: _json.parse - Unexpected token'
  );
});

test('_json.parse string quoted', () => {
  expect(json({ params: '"firstName"', location: 'locationId', methodName: 'parse' })).toEqual(
    'firstName'
  );
});

test('_json.parse number', () => {
  expect(json({ params: '1', location: 'locationId', methodName: 'parse' })).toEqual(1);
});

test('_json.parse boolean true', () => {
  expect(json({ params: 'true', location: 'locationId', methodName: 'parse' })).toEqual(true);
});

test('_json.parse boolean false', () => {
  expect(json({ params: 'false', location: 'locationId', methodName: 'parse' })).toEqual(false);
});

test('_json.parse null', () => {
  expect(json({ params: 'null', location: 'locationId', methodName: 'parse' })).toEqual(null);
});

test('_json.parse undefined string', () => {
  expect(json({ params: 'undefined', location: 'locationId', methodName: 'parse' })).toEqual(
    undefined
  );
});

test('_json.parse object not allowed', () => {
  expect(() => json({ params: { b: 'm' }, location: 'locationId', methodName: 'parse' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _json.parse accepts one of the following types: string.
          Received: {\\"_json.parse\\":{\\"b\\":\\"m\\"}} at locationId."
  `);
});

test('_json.parse date not supported', () => {
  expect(() => json({ params: new Date(0), location: 'locationId', methodName: 'parse' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _json.parse accepts one of the following types: string.
          Received: {\\"_json.parse\\":\\"1970-01-01T00:00:00.000Z\\"} at locationId."
  `);
});

test('_json.parse array', () => {
  expect(
    json({ params: '[{ "a": "a1"},{ "a": "a2"}]', location: 'locationId', methodName: 'parse' })
  ).toEqual([{ a: 'a1' }, { a: 'a2' }]);
});

test('_json.parse date array', () => {
  expect(
    json({
      params: '[{ "~d": "1970-01-01T00:00:00.000Z"},{ "~d": "1970-01-01T00:00:00.001Z"}]',
      location: 'locationId',
      methodName: 'parse',
    })
  ).toEqual([new Date(0), new Date(1)]);
});

test('_json.parse date as object', () => {
  expect(
    json({
      params: '{ "~d": "1970-01-01T00:00:00.000Z"}',
      location: 'locationId',
      methodName: 'parse',
    })
  ).toEqual(new Date(0));
});

test('_json.parse date in object', () => {
  expect(
    json({
      params: '{"a": { "~d": "1970-01-01T00:00:00.000Z"} }',
      location: 'locationId',
      methodName: 'parse',
    })
  ).toEqual({ a: new Date(0) });
});

test('_json.stringify string', () => {
  expect(json({ params: ['firstName'], location: 'locationId', methodName: 'stringify' })).toEqual(
    '"firstName"'
  );
});

test('_json.stringify number', () => {
  expect(json({ params: [1], location: 'locationId', methodName: 'stringify' })).toEqual('1');
});

test('_json.stringify boolean true', () => {
  expect(json({ params: [true], location: 'locationId', methodName: 'stringify' })).toEqual('true');
});

test('_json.stringify boolean false', () => {
  expect(json({ params: [false], location: 'locationId', methodName: 'stringify' })).toEqual(
    'false'
  );
});

test('_json.stringify null', () => {
  expect(json({ params: [null], location: 'locationId', methodName: 'stringify' })).toEqual('null');
});

test('_json.stringify undefined in object', () => {
  expect(
    json({ params: [{ b: undefined }], location: 'locationId', methodName: 'stringify' })
  ).toEqual('{}');
});

// This is unexpected but happens due to the way JSON stringify works
test('_json.stringify undefined', () => {
  expect(json({ params: [undefined], location: 'locationId', methodName: 'stringify' })).toEqual(); // expected 'undefined' ?
});

test('_json.stringify date', () => {
  expect(json({ params: [new Date(0)], location: 'locationId', methodName: 'stringify' })).toEqual(
    '{ "~d": "1970-01-01T00:00:00.000Z" }'
  );
});

test('_json.stringify array', () => {
  expect(
    json({ params: [[{ a: 'a1' }, { a: 'a2' }]], location: 'locationId', methodName: 'stringify' })
  ).toMatchInlineSnapshot(`
    "[
      {
        \\"a\\": \\"a1\\"
      },
      {
        \\"a\\": \\"a2\\"
      }
    ]"
  `);
});

test('_json.stringify date array', () => {
  expect(
    json({ params: [[new Date(0), new Date(1)]], location: 'locationId', methodName: 'stringify' })
  ).toMatchInlineSnapshot(`
    "[
      {
        \\"~d\\": \\"1970-01-01T00:00:00.000Z\\"
      },
      {
        \\"~d\\": \\"1970-01-01T00:00:00.001Z\\"
      }
    ]"
  `);
});

test('_json.stringify date object', () => {
  expect(json({ params: [{ a: new Date(0) }], location: 'locationId', methodName: 'stringify' }))
    .toMatchInlineSnapshot(`
    "{
      \\"a\\": {
        \\"~d\\": \\"1970-01-01T00:00:00.000Z\\"
      }
    }"
  `);
});

test('_json.stringify object params', () => {
  expect(json({ params: { on: { a: 1 } }, location: 'locationId', methodName: 'stringify' }))
    .toMatchInlineSnapshot(`
    "{
      \\"a\\": 1
    }"
  `);
});

test('_json.stringify object params with options', () => {
  expect(
    json({
      params: { on: { a: new Date(101) }, options: { isoStringDates: false } },
      location: 'locationId',
      methodName: 'stringify',
    })
  ).toMatchInlineSnapshot(`
    "{
      \\"a\\": {
        \\"~d\\": 101
      }
    }"
  `);
});
