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

import { transformWrite } from './transformTypes.js';

test('transformWrite invalid input', () => {
  expect(() => transformWrite({ input: 1 })).toThrow(
    'transformWrite received invalid input type number.'
  );
});

test('transformWrite works on an object', () => {
  expect(
    transformWrite({
      input: {
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
    numberTransform: '1',
    booleanTransform: 'TRUE',
    dateTransform: '2020-01-26T00:00:00.000Z',
    jsonTransform: '{"key":"value"}',
  });
});

test('transformWrite works on an object, no types provided', () => {
  expect(
    transformWrite({
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

test('transformWrite works on an array', () => {
  expect(
    transformWrite({
      input: [
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
      numberTransform: '1',
      booleanTransform: 'TRUE',
      dateTransform: '2020-01-26T00:00:00.000Z',
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
      dateTransform: '2020-01-27T00:00:00.000Z',
      jsonTransform: '{"key":"value2"}',
    },
  ]);
});

test('transformWrite works on an array, no types provided', () => {
  expect(
    transformWrite({
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

test('transformWrite numbers', () => {
  expect(
    transformWrite({
      input: [
        {
          numberTransform: 1,
          original: 1,
        },
        {
          numberTransform: 2.0,
          original: 2.0,
        },
        {
          numberTransform: 3.141592,
          original: 3.141592,
        },
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
      numberTransform: '1',
      original: 1,
    },
    {
      numberTransform: '2',
      original: 2.0,
    },
    {
      numberTransform: '3.141592',
      original: 3.141592,
    },
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
  ]);
});

test('transformWrite booleans', () => {
  expect(
    transformWrite({
      input: [
        {
          booleanTransform: true,
          original: true,
        },
        {
          booleanTransform: false,
          original: false,
        },
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
      booleanTransform: 'TRUE',
      original: true,
    },
    {
      booleanTransform: 'FALSE',
      original: false,
    },
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
  ]);
});

test('transformWrite dates', () => {
  expect(
    transformWrite({
      input: [
        {
          dateTransform: new Date('2020-01-27T00:00:00.000Z'),
          original: new Date('2020-01-27T00:00:00.000Z'),
        },
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
      dateTransform: '2020-01-27T00:00:00.000Z',
      original: new Date('2020-01-27T00:00:00.000Z'),
    },
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
  ]);
});

test('transformWrite json', () => {
  const circular = {};
  circular.reference = circular;
  expect(
    transformWrite({
      input: [
        {
          jsonTransform: 1,
          original: 1,
        },
        {
          jsonTransform: 2,
          original: 2.0,
        },
        {
          jsonTransform: 3.141592,
          original: 3.141592,
        },
        {
          jsonTransform: 'Hello',
          original: 'Hello',
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
          jsonTransform: {
            key: 'value',
          },
          original: {
            key: 'value',
          },
        },
        {
          jsonTransform: [1, 2, 3],
          original: [1, 2, 3],
        },
        {
          jsonTransform: {},
          original: {},
        },
        {
          jsonTransform: [],
          original: [],
        },
        {
          jsonTransform: undefined,
          original: undefined,
        },
        {
          jsonTransform: NaN,
          original: NaN,
        },
        {
          // JSON stringify throws on circular references
          jsonTransform: circular,
          original: circular,
        },
      ],
      types: {
        jsonTransform: 'json',
      },
    })
  ).toEqual([
    {
      jsonTransform: '1',
      original: 1,
    },
    {
      jsonTransform: '2',
      original: 2.0,
    },
    {
      jsonTransform: '3.141592',
      original: 3.141592,
    },
    {
      jsonTransform: '"Hello"',
      original: 'Hello',
    },
    {
      jsonTransform: 'null',
      original: null,
    },
    {
      jsonTransform: 'true',
      original: true,
    },
    {
      jsonTransform: 'false',
      original: false,
    },
    {
      jsonTransform: '{"key":"value"}',
      original: {
        key: 'value',
      },
    },
    {
      jsonTransform: '[1,2,3]',
      original: [1, 2, 3],
    },
    {
      jsonTransform: '{}',
      original: {},
    },
    {
      jsonTransform: '[]',
      original: [],
    },
    {
      jsonTransform: undefined,
      original: undefined,
    },
    {
      jsonTransform: 'null',
      original: NaN,
    },
    {
      jsonTransform: circular,
      original: circular,
    },
  ]);
});
