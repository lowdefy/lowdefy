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

import { transformRead } from './transformTypes.js';

test('transformRead invalid input', () => {
  expect(() => transformRead({ input: 1 })).toThrow(
    'transformRead received invalid input type number.'
  );
});

test('transformRead works on an object', () => {
  expect(
    transformRead({
      input: {
        string: 'string',
        number: '1',
        boolean: 'TRUE',
        date: '2020/01/26',
        json: '{"key":"value"}',
        stringTransform: 'string',
        numberTransform: '1',
        booleanTransform: 'TRUE',
        dateTransform: '2020/01/26',
        jsonTransform: '{"key":"value"}',
      },
      types: {
        stringTransform: 'string',
        numberTransform: 'number',
        booleanTransform: 'boolean',
        dateTransform: 'date',
        jsonTransform: 'json',
      },
    })
  ).toEqual({
    string: 'string',
    number: '1',
    boolean: 'TRUE',
    date: '2020/01/26',
    json: '{"key":"value"}',
    stringTransform: 'string',
    numberTransform: 1,
    booleanTransform: true,
    dateTransform: new Date('2020-01-26T00:00:00.000Z'),
    jsonTransform: { key: 'value' },
  });
});

test('transformRead works on an object, no types provided', () => {
  expect(
    transformRead({
      input: {
        string: 'string',
        number: '1',
        boolean: 'TRUE',
        date: '2020/01/26',
        json: '{"key":"value"}',
      },
    })
  ).toEqual({
    string: 'string',
    number: '1',
    boolean: 'TRUE',
    date: '2020/01/26',
    json: '{"key":"value"}',
  });
});

test('transformRead works on an array', () => {
  expect(
    transformRead({
      input: [
        {
          string: 'string',
          number: '1',
          boolean: 'TRUE',
          date: '2020/01/26',
          json: '{"key":"value"}',
          stringTransform: 'string',
          numberTransform: '1',
          booleanTransform: 'TRUE',
          dateTransform: '2020/01/26',
          jsonTransform: '{"key":"value"}',
        },
        {
          string: 'string2',
          number: '2',
          boolean: 'FALSE',
          date: '2020/01/27',
          json: '{"key":"value2"}',
          stringTransform: 'string2',
          numberTransform: '2',
          booleanTransform: 'FALSE',
          dateTransform: '2020/01/27',
          jsonTransform: '{"key":"value2"}',
        },
      ],
      types: {
        stringTransform: 'string',
        numberTransform: 'number',
        booleanTransform: 'boolean',
        dateTransform: 'date',
        jsonTransform: 'json',
      },
    })
  ).toEqual([
    {
      string: 'string',
      number: '1',
      boolean: 'TRUE',
      date: '2020/01/26',
      json: '{"key":"value"}',
      stringTransform: 'string',
      numberTransform: 1,
      booleanTransform: true,
      dateTransform: new Date('2020-01-26T00:00:00.000Z'),
      jsonTransform: { key: 'value' },
    },
    {
      string: 'string2',
      number: '2',
      boolean: 'FALSE',
      date: '2020/01/27',
      json: '{"key":"value2"}',
      stringTransform: 'string2',
      numberTransform: 2,
      booleanTransform: false,
      dateTransform: new Date('2020-01-27T00:00:00.000Z'),
      jsonTransform: { key: 'value2' },
    },
  ]);
});

test('transformRead works on an array, no types provided', () => {
  expect(
    transformRead({
      input: [
        {
          string: 'string',
          number: '1',
          boolean: 'TRUE',
          date: '2020/01/26',
          json: '{"key":"value"}',
        },
        {
          string: 'string2',
          number: '2',
          boolean: 'FALSE',
          date: '2020/01/27',
          json: '{"key":"value2"}',
        },
      ],
    })
  ).toEqual([
    {
      string: 'string',
      number: '1',
      boolean: 'TRUE',
      date: '2020/01/26',
      json: '{"key":"value"}',
    },
    {
      string: 'string2',
      number: '2',
      boolean: 'FALSE',
      date: '2020/01/27',
      json: '{"key":"value2"}',
    },
  ]);
});

test('transformRead numbers', () => {
  expect(
    transformRead({
      input: [
        {
          numberTransform: '1',
          original: '1',
        },
        {
          numberTransform: '2.0',
          original: '2.0',
        },
        {
          numberTransform: '3.141592',
          original: '3.141592',
        },
        {
          numberTransform: '4.2asdfg',
          original: '4.2asdfg',
        },
        {
          numberTransform: NaN,
          original: NaN,
        },
        {
          numberTransform: null,
          original: null,
        },
        {
          numberTransform: 'Hello',
          original: 'Hello',
        },
        {
          numberTransform: {},
          original: {},
        },
        {
          numberTransform: [],
          original: [],
        },
      ],
      types: {
        numberTransform: 'number',
      },
    })
  ).toEqual([
    {
      numberTransform: 1,
      original: '1',
    },
    {
      numberTransform: 2,
      original: '2.0',
    },
    {
      numberTransform: 3.141592,
      original: '3.141592',
    },
    {
      numberTransform: null,
      original: '4.2asdfg',
    },
    {
      numberTransform: null,
      original: NaN,
    },
    {
      numberTransform: 0,
      original: null,
    },
    {
      numberTransform: null,
      original: 'Hello',
    },
    {
      numberTransform: null,
      original: {},
    },
    {
      numberTransform: 0,
      original: [],
    },
  ]);
});

test('transformRead booleans', () => {
  expect(
    transformRead({
      input: [
        {
          booleanTransform: 'TRUE',
          original: 'TRUE',
        },
        {
          booleanTransform: 'FALSE',
          original: 'FALSE',
        },
        {
          booleanTransform: 'False',
          original: 'False',
        },
        {
          booleanTransform: 'True',
          original: 'True',
        },
        {
          booleanTransform: 'true',
          original: 'true',
        },
        {
          booleanTransform: 'false',
          original: 'false',
        },
        {
          booleanTransform: true,
          original: true,
        },
        {
          booleanTransform: false,
          original: false,
        },
        {
          booleanTransform: 1,
          original: 1,
        },
        {
          booleanTransform: 0,
          original: 0,
        },
        {
          booleanTransform: 42,
          original: 42,
        },
        {
          booleanTransform: 'Hello',
          original: 'Hello',
        },
        {
          booleanTransform: null,
          original: null,
        },
        {
          booleanTransform: {},
          original: {},
        },
        {
          booleanTransform: [],
          original: [],
        },
      ],
      types: {
        booleanTransform: 'boolean',
      },
    })
  ).toEqual([
    {
      booleanTransform: true,
      original: 'TRUE',
    },
    {
      booleanTransform: false,
      original: 'FALSE',
    },
    {
      booleanTransform: false,
      original: 'False',
    },
    {
      booleanTransform: false,
      original: 'True',
    },
    {
      booleanTransform: false,
      original: 'true',
    },
    {
      booleanTransform: false,
      original: 'false',
    },
    {
      booleanTransform: false,
      original: true,
    },
    {
      booleanTransform: false,
      original: false,
    },
    {
      booleanTransform: false,
      original: 1,
    },
    {
      booleanTransform: false,
      original: 0,
    },
    {
      booleanTransform: false,
      original: 42,
    },
    {
      booleanTransform: false,
      original: 'Hello',
    },
    {
      booleanTransform: false,
      original: null,
    },
    {
      booleanTransform: false,
      original: {},
    },
    {
      booleanTransform: false,
      original: [],
    },
  ]);
});

test('transformRead dates', () => {
  expect(
    transformRead({
      input: [
        {
          dateTransform: '2020/01/27',
          original: '2020/01/27',
        },
        {
          dateTransform: '2020-01-27T00:00:00.000Z',
          original: '2020-01-27T00:00:00.000Z',
        },
        {
          dateTransform: 1,
          original: 1,
        },
        {
          dateTransform: '1',
          original: '1',
        },
        {
          dateTransform: '2.0',
          original: '2.0',
        },
        {
          dateTransform: '3.141592',
          original: '3.141592',
        },
        {
          dateTransform: NaN,
          original: NaN,
        },
        {
          dateTransform: null,
          original: null,
        },
        {
          dateTransform: 'Hello',
          original: 'Hello',
        },
      ],
      types: {
        dateTransform: 'date',
      },
    })
  ).toEqual([
    {
      dateTransform: new Date('2020-01-27T00:00:00.000Z'),
      original: '2020/01/27',
    },
    {
      dateTransform: new Date('2020-01-27T00:00:00.000Z'),
      original: '2020-01-27T00:00:00.000Z',
    },
    {
      dateTransform: new Date('1970-01-01T00:00:00.001Z'),
      original: 1,
    },
    {
      dateTransform: new Date('2001-01-01T00:00:00.000Z'), // This is weird
      original: '1',
    },
    {
      dateTransform: null,
      original: '2.0',
    },
    {
      dateTransform: null,
      original: '3.141592',
    },
    {
      dateTransform: null,
      original: NaN,
    },
    {
      dateTransform: null,
      original: null,
    },
    {
      dateTransform: null,
      original: 'Hello',
    },
  ]);
});

test('transformRead json', () => {
  expect(
    transformRead({
      input: [
        {
          jsonTransform: '1',
          original: '1',
        },
        {
          jsonTransform: '2.0',
          original: '2.0',
        },
        {
          jsonTransform: '3.141592',
          original: '3.141592',
        },
        {
          jsonTransform: 'Hello',
          original: 'Hello',
        },
        {
          jsonTransform: '"Hello"',
          original: '"Hello"',
        },
        {
          jsonTransform: 'null',
          original: 'null',
        },
        {
          jsonTransform: 'true',
          original: 'true',
        },
        {
          jsonTransform: 'false',
          original: 'false',
        },
        {
          jsonTransform: '{"key":"value"}',
          original: '{"key":"value"}',
        },
        {
          jsonTransform: '[1,2,3]',
          original: '[1,2,3]',
        },
        {
          jsonTransform: '{}',
          original: '{}',
        },
        {
          jsonTransform: '[]',
          original: '[]',
        },
        {
          jsonTransform: '[1,2,3',
          original: '[1,2,3',
        },
        {
          jsonTransform: '"Hell',
          original: '"Hell',
        },
        {
          jsonTransform: 'undefined',
          original: 'undefined',
        },
        {
          jsonTransform: NaN,
          original: NaN,
        },
        {
          jsonTransform: null,
          original: null,
        },
        {
          jsonTransform: true,
          original: true,
        },
        {
          jsonTransform: false,
          original: false,
        },
        {
          jsonTransform: 42,
          original: 42,
        },
        {
          jsonTransform: {},
          original: {},
        },
        {
          jsonTransform: [],
          original: [],
        },
      ],
      types: {
        jsonTransform: 'json',
      },
    })
  ).toEqual([
    {
      jsonTransform: 1,
      original: '1',
    },
    {
      jsonTransform: 2,
      original: '2.0',
    },
    {
      jsonTransform: 3.141592,
      original: '3.141592',
    },
    {
      jsonTransform: null,
      original: 'Hello',
    },
    {
      jsonTransform: 'Hello',
      original: '"Hello"',
    },
    {
      jsonTransform: null,
      original: 'null',
    },
    {
      jsonTransform: true,
      original: 'true',
    },
    {
      jsonTransform: false,
      original: 'false',
    },
    {
      jsonTransform: {
        key: 'value',
      },
      original: '{"key":"value"}',
    },
    {
      jsonTransform: [1, 2, 3],
      original: '[1,2,3]',
    },
    {
      jsonTransform: {},
      original: '{}',
    },
    {
      jsonTransform: [],
      original: '[]',
    },
    {
      jsonTransform: null,
      original: '[1,2,3',
    },
    {
      jsonTransform: null,
      original: '"Hell',
    },
    {
      jsonTransform: null,
      original: 'undefined',
    },
    {
      jsonTransform: null,
      original: NaN,
    },
    {
      jsonTransform: null,
      original: null,
    },
    {
      jsonTransform: true,
      original: true,
    },
    {
      jsonTransform: false,
      original: false,
    },
    {
      jsonTransform: 42,
      original: 42,
    },
    {
      jsonTransform: null,
      original: {},
    },
    {
      jsonTransform: null,
      original: [],
    },
  ]);
});
