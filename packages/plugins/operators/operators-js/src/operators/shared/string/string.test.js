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

import string from './string.js';
const location = 'location';

describe('_string.charAt', () => {
  const methodName = 'charAt';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 2],
        methodName,
        location,
      })
    ).toEqual('c');
    expect(
      string({
        params: ['abcdef', 12],
        methodName,
        location,
      })
    ).toEqual('');
    expect(
      string({
        params: { on: 'abcdef', index: 2 },
        methodName,
        location,
      })
    ).toEqual('c');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.charAt must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.charAt\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.charAt must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.charAt\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.charAt accepts one of the following types: array, object.
            Received: {\\"_string.charAt\\":null} at location."
    `);
  });
});

describe('_string.concat', () => {
  const methodName = 'concat';
  test('valid', () => {
    expect(
      string({
        params: ['abc', 'aabbcc'],
        methodName,
        location,
      })
    ).toEqual('abcaabbcc');
    expect(
      string({
        params: ['abcdef', 12],
        methodName,
        location,
      })
    ).toEqual('abcdef12');
    expect(
      string({
        params: [null, 12, 'abc'],
        methodName,
        location,
      })
    ).toEqual('12abc');
    expect(
      string({
        params: ['', 12, 'abc'],
        methodName,
        location,
      })
    ).toEqual('12abc');
    expect(
      string({
        params: ['abcdef', true],
        methodName,
        location,
      })
    ).toEqual('abcdeftrue');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.concat must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.concat\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: 'abc',
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.concat accepts one of the following types: array.
            Received: {\\"_string.concat\\":\\"abc\\"} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.concat accepts one of the following types: array.
            Received: {\\"_string.concat\\":null} at location."
    `);
  });
});

describe('_string.endsWith', () => {
  const methodName = 'endsWith';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'ef'],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'ef' },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'a' },
        methodName,
        location,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.endsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.endsWith\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.endsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.endsWith\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.endsWith accepts one of the following types: array, object.
            Received: {\\"_string.endsWith\\":null} at location."
    `);
  });
});

describe('_string.includes', () => {
  const methodName = 'includes';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'e'],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'ef', position: 4 },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'a' },
        methodName,
        location,
      })
    ).toEqual(true);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.includes must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.includes\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.includes must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.includes\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.includes accepts one of the following types: array, object.
            Received: {\\"_string.includes\\":null} at location."
    `);
  });
});

describe('_string.indexOf', () => {
  const methodName = 'indexOf';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'e'],
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      string({
        params: ['abcdef', 'x'],
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      string({
        params: { on: 'abcdef', searchValue: 'ef', fromIndex: 4 },
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      string({
        params: { on: 'abcdef', searchValue: 'a' },
        methodName,
        location,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.indexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.indexOf\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.indexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.indexOf\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.indexOf accepts one of the following types: array, object.
            Received: {\\"_string.indexOf\\":null} at location."
    `);
  });
});

describe('_string.lastIndexOf', () => {
  const methodName = 'lastIndexOf';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e'],
        methodName,
        location,
      })
    ).toEqual(6);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
        location,
      })
    ).toEqual(2);
    expect(
      string({
        params: { on: 'abcdefe', searchValue: 'ef', fromIndex: 3 },
        methodName,
        location,
      })
    ).toEqual(-1);
    expect(
      string({
        params: { on: 'abcdef', searchValue: 'a' },
        methodName,
        location,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.lastIndexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.lastIndexOf\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.lastIndexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.lastIndexOf\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.lastIndexOf accepts one of the following types: array, object.
            Received: {\\"_string.lastIndexOf\\":null} at location."
    `);
  });
});

describe('_string.match', () => {
  const methodName = 'match';
  test('valid', () => {
    expect(
      JSON.stringify(
        string({
          params: ['abcdefe', 'e'],
          methodName,
          location,
        })
      )
    ).toEqual(JSON.stringify(['e']));
    expect(
      JSON.stringify(
        string({
          params: [null, 'e'],
          methodName,
          location,
        })
      )
    ).toEqual(JSON.stringify(null));
    expect(
      string({
        params: ['abcdefe', '/e/g'],
        methodName,
        location,
      })
    ).toStrictEqual(null); // regex only work on named args
    expect(
      JSON.stringify(
        string({
          params: ['abcdef', 'c'],
          methodName,
          location,
        })
      )
    ).toStrictEqual(JSON.stringify(['c']));
    expect(
      JSON.stringify(
        string({
          params: { on: 'abcdef', regex: 'ef' },
          methodName,
          location,
        })
      )
    ).toStrictEqual(JSON.stringify(['ef']));
    expect(
      JSON.stringify(
        string({
          params: { on: 'abcdefE', regex: 'e', regexFlags: 'gi' },
          methodName,
          location,
        })
      )
    ).toStrictEqual(JSON.stringify(['e', 'E']));
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.match must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.match\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.match must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.match\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.match accepts one of the following types: array, object.
            Received: {\\"_string.match\\":null} at location."
    `);
  });
});

describe('_string.normalize', () => {
  const methodName = 'normalize';
  test('valid', () => {
    expect(
      string({
        params: ['\u0041\u006d\u00e9\u006c\u0069\u0065'],
        methodName,
        location,
      })
    ).toEqual('Amélie');
    expect(
      string({
        params: { on: '\u0041\u006d\u00e9\u006c\u0069\u0065' },
        methodName,
        location,
      })
    ).toEqual('Amélie');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: ['\u0041\u006d\u00e9\u006c\u0069\u0065', 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Operator Error: _string.normalize - The normalization form should be one of NFC, NFD, NFKC, NFKD. Received: {\\"_string.normalize\\":[\\"Amélie\\",2]} at location."`
    );
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.normalize must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.normalize\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.normalize must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.normalize\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.normalize accepts one of the following types: array, object.
            Received: {\\"_string.normalize\\":null} at location."
    `);
  });
});

describe('_string.padEnd', () => {
  const methodName = 'padEnd';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 10, '_'],
        methodName,
        location,
      })
    ).toEqual('abcdef____');
    expect(
      string({
        params: ['abcdef', 8],
        methodName,
        location,
      })
    ).toEqual('abcdef  ');
    expect(
      string({
        params: { on: 'abcdef', targetLength: 10, padString: '.' },
        methodName,
        location,
      })
    ).toEqual('abcdef....');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.padEnd must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.padEnd\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.padEnd must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.padEnd\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.padEnd accepts one of the following types: array, object.
            Received: {\\"_string.padEnd\\":null} at location."
    `);
  });
});

describe('_string.padStart', () => {
  const methodName = 'padStart';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 10],
        methodName,
        location,
      })
    ).toEqual('    abcdef');
    expect(
      string({
        params: ['abcdef', 8, '_'],
        methodName,
        location,
      })
    ).toEqual('__abcdef');
    expect(
      string({
        params: { on: 'abcdef', targetLength: 10, padString: '.' },
        methodName,
        location,
      })
    ).toEqual('....abcdef');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.padStart must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.padStart\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.padStart must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.padStart\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.padStart accepts one of the following types: array, object.
            Received: {\\"_string.padStart\\":null} at location."
    `);
  });
});

describe('_string.repeat', () => {
  const methodName = 'repeat';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 3],
        methodName,
        location,
      })
    ).toEqual('abcdefabcdefabcdef');
    expect(
      string({
        params: { on: 'abcdef', count: 3 },
        methodName,
        location,
      })
    ).toEqual('abcdefabcdefabcdef');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.repeat must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.repeat\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.repeat must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.repeat\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.repeat accepts one of the following types: array, object.
            Received: {\\"_string.repeat\\":null} at location."
    `);
  });
});

describe('_string.replace', () => {
  const methodName = 'replace';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e', '_'],
        methodName,
        location,
      })
    ).toEqual('abcd_fe');
    expect(
      string({
        params: { on: 'abcdefef', regex: 'ef', newSubstr: '.' },
        methodName,
        location,
      })
    ).toEqual('abcd.ef');
    expect(
      string({
        params: { on: 'abcdefef', regex: 'ef', newSubstr: '.', regexFlags: 'g' },
        methodName,
        location,
      })
    ).toEqual('abcd..');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.replace must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.replace\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.replace must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.replace\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.replace accepts one of the following types: array, object.
            Received: {\\"_string.replace\\":null} at location."
    `);
  });
});

describe('_string.search', () => {
  const methodName = 'search';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e'],
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      string({
        params: { on: 'abcdef', regex: 'ef' },
        methodName,
        location,
      })
    ).toEqual(4);
    expect(
      string({
        params: { on: 'abcdeaf', regex: 'a', regexFlags: 'g' },
        methodName,
        location,
      })
    ).toEqual(0);
    expect(
      string({
        params: { on: 'abcdeaf', regex: 'x' },
        methodName,
        location,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.search must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.search\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.search must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.search\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.search accepts one of the following types: array, object.
            Received: {\\"_string.search\\":null} at location."
    `);
  });
});

describe('_string.slice', () => {
  const methodName = 'slice';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 2, 4],
        methodName,
        location,
      })
    ).toEqual('cd');
    expect(
      string({
        params: ['abcdefe', 3],
        methodName,
        location,
      })
    ).toEqual('defe');
    expect(
      string({
        params: { on: 'abcdef', start: 1 },
        methodName,
        location,
      })
    ).toEqual('bcdef');
    expect(
      string({
        params: { on: 'abcdeaf', start: 2, end: 4 },
        methodName,
        location,
      })
    ).toEqual('cd');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.slice must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.slice\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.slice must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.slice\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.slice accepts one of the following types: array, object.
            Received: {\\"_string.slice\\":null} at location."
    `);
  });
});

describe('_string.split', () => {
  const methodName = 'split';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e'],
        methodName,
        location,
      })
    ).toEqual(['abcd', 'f', '']);
    expect(
      string({
        params: ['abcdefe', 'de'],
        methodName,
        location,
      })
    ).toEqual(['abc', 'fe']);
    expect(
      string({
        params: { on: 'abcdefe', separator: 'e' },
        methodName,
        location,
      })
    ).toEqual(['abcd', 'f', '']);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.split must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.split\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.split must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.split\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.split accepts one of the following types: array, object.
            Received: {\\"_string.split\\":null} at location."
    `);
  });
});

describe('_string.startsWith', () => {
  const methodName = 'startsWith';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'ab'],
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      string({
        params: ['abcdef', 'c'],
        methodName,
        location,
      })
    ).toEqual(false);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'ef', position: 4 },
        methodName,
        location,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'a' },
        methodName,
        location,
      })
    ).toEqual(true);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.startsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.startsWith\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.startsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.startsWith\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.startsWith accepts one of the following types: array, object.
            Received: {\\"_string.startsWith\\":null} at location."
    `);
  });
});

describe('_string.substring', () => {
  const methodName = 'substring';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 2, 4],
        methodName,
        location,
      })
    ).toEqual('cd');
    expect(
      string({
        params: ['abcdefe', 3],
        methodName,
        location,
      })
    ).toEqual('defe');
    expect(
      string({
        params: { on: 'abcdef', start: 1 },
        methodName,
        location,
      })
    ).toEqual('bcdef');
    expect(
      string({
        params: { on: 'abcdeaf', start: 2, end: 4 },
        methodName,
        location,
      })
    ).toEqual('cd');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.substring must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.substring\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: { on: true },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.substring must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array.
          Received: {\\"_string.substring\\":{\\"on\\":true}} at location."
    `);
    expect(() =>
      string({
        params: null,
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.substring accepts one of the following types: array, object.
            Received: {\\"_string.substring\\":null} at location."
    `);
  });
});

describe('_string.toLowerCase', () => {
  const methodName = 'toLowerCase';
  test('valid', () => {
    expect(
      string({
        params: 'AbC',
        methodName,
        location,
      })
    ).toEqual('abc');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.toLowerCase accepts one of the following types: string, null.
            Received: {\\"_string.toLowerCase\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: ['abc'],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.toLowerCase accepts one of the following types: string, null.
            Received: {\\"_string.toLowerCase\\":[\\"abc\\"]} at location."
    `);
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.toLowerCase accepts one of the following types: string, null.
            Received: {\\"_string.toLowerCase\\":{\\"on\\":\\"abc\\"}} at location."
    `);
  });
});

describe('_string.toUpperCase', () => {
  const methodName = 'toUpperCase';
  test('valid', () => {
    expect(
      string({
        params: 'abC',
        methodName,
        location,
      })
    ).toEqual('ABC');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.toUpperCase accepts one of the following types: string, null.
            Received: {\\"_string.toUpperCase\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: ['abc'],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.toUpperCase accepts one of the following types: string, null.
            Received: {\\"_string.toUpperCase\\":[\\"abc\\"]} at location."
    `);
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.toUpperCase accepts one of the following types: string, null.
            Received: {\\"_string.toUpperCase\\":{\\"on\\":\\"abc\\"}} at location."
    `);
  });
});

describe('_string.trim', () => {
  const methodName = 'trim';
  test('valid', () => {
    expect(
      string({
        params: '  abc    ',
        methodName,
        location,
      })
    ).toEqual('abc');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trim accepts one of the following types: string, null.
            Received: {\\"_string.trim\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: ['abc'],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trim accepts one of the following types: string, null.
            Received: {\\"_string.trim\\":[\\"abc\\"]} at location."
    `);
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trim accepts one of the following types: string, null.
            Received: {\\"_string.trim\\":{\\"on\\":\\"abc\\"}} at location."
    `);
  });
});

describe('_string.trimEnd', () => {
  const methodName = 'trimEnd';
  test('valid', () => {
    expect(
      string({
        params: '  abc    ',
        methodName,
        location,
      })
    ).toEqual('  abc');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trimEnd accepts one of the following types: string, null.
            Received: {\\"_string.trimEnd\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: ['abc'],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trimEnd accepts one of the following types: string, null.
            Received: {\\"_string.trimEnd\\":[\\"abc\\"]} at location."
    `);
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trimEnd accepts one of the following types: string, null.
            Received: {\\"_string.trimEnd\\":{\\"on\\":\\"abc\\"}} at location."
    `);
  });
});

describe('_string.trimStart', () => {
  const methodName = 'trimStart';
  test('valid', () => {
    expect(
      string({
        params: '  abc    ',
        methodName,
        location,
      })
    ).toEqual('abc    ');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trimStart accepts one of the following types: string, null.
            Received: {\\"_string.trimStart\\":[1,2]} at location."
    `);
    expect(() =>
      string({
        params: ['abc'],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trimStart accepts one of the following types: string, null.
            Received: {\\"_string.trimStart\\":[\\"abc\\"]} at location."
    `);
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.trimStart accepts one of the following types: string, null.
            Received: {\\"_string.trimStart\\":{\\"on\\":\\"abc\\"}} at location."
    `);
  });
});

describe('_string.length', () => {
  const methodName = 'length';
  test('valid', () => {
    expect(
      string({
        params: 'abcde',
        methodName,
        location,
      })
    ).toEqual(5);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: { on: '231' },
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.length accepts one of the following types: string, null.
            Received: {\\"_string.length\\":{\\"on\\":\\"231\\"}} at location."
    `);
    expect(() =>
      string({
        params: ['1'],
        methodName,
        location,
      })
    ).toThrowErrorMatchingInlineSnapshot(`
      "Operator Error: _string.length accepts one of the following types: string, null.
            Received: {\\"_string.length\\":[\\"1\\"]} at location."
    `);
  });
});

test('_string called with no method or params', () => {
  expect(() => string({ location: 'location' })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _string.undefined is not supported, use one of the following: charAt, concat, endsWith, includes, indexOf, lastIndexOf, match, normalize, padEnd, padStart, repeat, replace, search, slice, split, startsWith, substring, toLowerCase, toUpperCase, trim, trimEnd, trimStart, length.
          Received: {\\"_string.undefined\\":undefined} at location."
  `);
});

test('_string invalid method', () => {
  expect(() => string({ params: ['a'], methodName: 'X', location: 'location' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _string.X is not supported, use one of the following: charAt, concat, endsWith, includes, indexOf, lastIndexOf, match, normalize, padEnd, padStart, repeat, replace, search, slice, split, startsWith, substring, toLowerCase, toUpperCase, trim, trimEnd, trimStart, length.
          Received: {\\"_string.X\\":[\\"a\\"]} at location."
  `);
});
