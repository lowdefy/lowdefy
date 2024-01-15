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

import yaml from './yaml.js';

test('_yaml.parse string unquoted', () => {
  expect(yaml({ params: ['firstName'], location: 'locationId', methodName: 'parse' })).toEqual(
    'firstName'
  );
});

test('_yaml.parse string quoted', () => {
  expect(yaml({ params: ['"firstName"'], location: 'locationId', methodName: 'parse' })).toEqual(
    'firstName'
  );
});

test('_yaml.parse number', () => {
  expect(yaml({ params: ['1'], location: 'locationId', methodName: 'parse' })).toEqual(1);
});

test('_yaml.parse boolean true', () => {
  expect(yaml({ params: ['true'], location: 'locationId', methodName: 'parse' })).toEqual(true);
});

test('_yaml.parse boolean false', () => {
  expect(yaml({ params: ['false'], location: 'locationId', methodName: 'parse' })).toEqual(false);
});

test('_yaml.parse null', () => {
  expect(yaml({ params: ['null'], location: 'locationId', methodName: 'parse' })).toEqual(null);
});

test('_yaml.parse undefined string', () => {
  expect(yaml({ params: ['undefined'], location: 'locationId', methodName: 'parse' })).toEqual(
    undefined
  );
});

test('_yaml.parse object not allowed', () => {
  expect(() =>
    yaml({ params: [{ a: 'b' }], location: 'locationId', methodName: 'parse' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _yaml.parse - requires a string type to parse. Received: {\\"_yaml.parse\\":[{\\"a\\":\\"b\\"}]} at locationId."`
  );
});

test('_yaml.parse date not supported', () => {
  expect(() =>
    yaml({ params: [new Date(0)], location: 'locationId', methodName: 'parse' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _yaml.parse - requires a string type to parse. Received: {\\"_yaml.parse\\":[\\"1970-01-01T00:00:00.000Z\\"]} at locationId."`
  );
});

test('_yaml.parse array', () => {
  expect(
    yaml({
      params: [
        `- a: a1
- a: a2`,
      ],
      location: 'locationId',
      methodName: 'parse',
    })
  ).toEqual([{ a: 'a1' }, { a: 'a2' }]);
});

test('_yaml.parse date array', () => {
  expect(
    yaml({
      params: [
        `- ~d: "1970-01-01T00:00:00.000Z"
- ~d: "1970-01-01T00:00:00.001Z"`,
      ],
      location: 'locationId',
      methodName: 'parse',
    })
  ).toEqual([new Date(0), new Date(1)]);
});

test('_yaml.parse date as object', () => {
  expect(
    yaml({
      params: ['~d: "1970-01-01T00:00:00.000Z"'],
      location: 'locationId',
      methodName: 'parse',
    })
  ).toEqual(new Date(0));
});

test('_yaml.parse date object', () => {
  expect(
    yaml({
      params: [
        `a:
  ~d: "1970-01-01T00:00:00.000Z"`,
      ],
      location: 'locationId',
      methodName: 'parse',
    })
  ).toEqual({ a: new Date(0) });
});

test('_yaml.parse non string', () => {
  expect(() =>
    yaml({ params: [123], location: 'locationId', methodName: 'parse' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _yaml.parse - requires a string type to parse. Received: {\\"_yaml.parse\\":[123]} at locationId."`
  );
});

test('_yaml.stringify string', () => {
  expect(yaml({ params: ['firstName'], location: 'locationId', methodName: 'stringify' }))
    .toEqual(`firstName
`);
});

test('_yaml.stringify number', () => {
  expect(yaml({ params: [1], location: 'locationId', methodName: 'stringify' })).toEqual(`1
`);
});

test('_json.stringify boolean true', () => {
  expect(yaml({ params: [true], location: 'locationId', methodName: 'stringify' })).toEqual(`true
`);
});

test('_yaml.stringify boolean false', () => {
  expect(yaml({ params: [false], location: 'locationId', methodName: 'stringify' })).toEqual(`false
`);
});

test('_yaml.stringify null', () => {
  expect(yaml({ params: [null], location: 'locationId', methodName: 'stringify' })).toEqual(`null
`);
});

test('_yaml.stringify undefined in object', () => {
  expect(yaml({ params: [{ b: undefined }], location: 'locationId', methodName: 'stringify' }))
    .toEqual(`{}
`);
});

test('_yaml.stringify undefined', () => {
  expect(yaml({ params: [undefined], location: 'locationId', methodName: 'stringify' })).toEqual(
    ''
  );
});

test('_yaml.stringify date', () => {
  expect(yaml({ params: [new Date(0)], location: 'locationId', methodName: 'stringify' }))
    .toMatchInlineSnapshot(`
    "~d: 1970-01-01T00:00:00.000Z
    "
  `);
});

test('_yaml.stringify array', () => {
  expect(
    yaml({ params: [[{ a: 'a1' }, { a: 'a2' }]], location: 'locationId', methodName: 'stringify' })
  ).toMatchInlineSnapshot(`
    "- a: a1
    - a: a2
    "
  `);
});

test('_yaml.stringify date array', () => {
  expect(
    yaml({ params: [[new Date(0), new Date(1)]], location: 'locationId', methodName: 'stringify' })
  ).toMatchInlineSnapshot(`
    "- ~d: 1970-01-01T00:00:00.000Z
    - ~d: 1970-01-01T00:00:00.001Z
    "
  `);
});

test('_yaml.stringify date object', () => {
  expect(yaml({ params: [{ a: new Date(0) }], location: 'locationId', methodName: 'stringify' }))
    .toMatchInlineSnapshot(`
    "a:
      ~d: 1970-01-01T00:00:00.000Z
    "
  `);
});

// TODO: consider sortKeys implementation.
// test('_yaml.stringify date object with options: sortKeys: false', () => {
//   expect(
//     yaml({
//       params: [{ b: new Date(0), a: new Date(0) }, { sortKeys: false }],
//       location: 'locationId',
//       methodName: 'stringify',
//     })
//   ).toMatchInlineSnapshot(`
//     "b:
//       ~d: 1970-01-01T00:00:00.000Z
//     a:
//       ~d: 1970-01-01T00:00:00.000Z
//     "
//   `);
// });

// test('_yaml.stringify as object with options: sortKeys: false', () => {
//   expect(
//     yaml({
//       params: { on: { b: new Date(0), a: new Date(0) }, options: { sortKeys: false } },
//       location: 'locationId',
//       methodName: 'stringify',
//     })
//   ).toMatchInlineSnapshot(`
//     "b:
//       ~d: 1970-01-01T00:00:00.000Z
//     a:
//       ~d: 1970-01-01T00:00:00.000Z
//     "
//   `);
// });

// test('_yaml.stringify as object with options: sortKeys: true', () => {
//   expect(
//     yaml({
//       params: { on: { b: new Date(0), a: new Date(0) }, options: { sortKeys: true } },
//       location: 'locationId',
//       methodName: 'stringify',
//     })
//   ).toMatchInlineSnapshot(`
//     "a:
//       ~d: 1970-01-01T00:00:00.000Z
//     b:
//       ~d: 1970-01-01T00:00:00.000Z
//     "
//   `);
// });
