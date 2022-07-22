/*
  Copyright 2020-2022 Lowdefy, Inc

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

describe('_string.charAt', () => {
  const methodName = 'charAt';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 2],
        methodName,
      })
    ).toEqual('c');
    expect(
      string({
        params: ['abcdef', 12],
        methodName,
      })
    ).toEqual('');
    expect(
      string({
        params: { on: 'abcdef', index: 2 },
        methodName,
      })
    ).toEqual('c');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.charAt must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.charAt must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.charAt accepts one of the following types: array, object."`
    );
  });
});

describe('_string.concat', () => {
  const methodName = 'concat';
  test('valid', () => {
    expect(
      string({
        params: ['abc', 'aabbcc'],
        methodName,
      })
    ).toEqual('abcaabbcc');
    expect(
      string({
        params: ['abcdef', 12],
        methodName,
      })
    ).toEqual('abcdef12');
    expect(
      string({
        params: [null, 12, 'abc'],
        methodName,
      })
    ).toEqual('12abc');
    expect(
      string({
        params: ['', 12, 'abc'],
        methodName,
      })
    ).toEqual('12abc');
    expect(
      string({
        params: ['abcdef', true],
        methodName,
      })
    ).toEqual('abcdeftrue');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.concat must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: 'abc',
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.concat accepts one of the following types: array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.concat accepts one of the following types: array."`
    );
  });
});

describe('_string.endsWith', () => {
  const methodName = 'endsWith';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'ef'],
        methodName,
      })
    ).toEqual(true);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'ef' },
        methodName,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'a' },
        methodName,
      })
    ).toEqual(false);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.endsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.endsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.endsWith accepts one of the following types: array, object."`
    );
  });
});

describe('_string.includes', () => {
  const methodName = 'includes';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'e'],
        methodName,
      })
    ).toEqual(true);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
      })
    ).toEqual(false);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'ef', position: 4 },
        methodName,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'a' },
        methodName,
      })
    ).toEqual(true);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.includes must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.includes must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.includes accepts one of the following types: array, object."`
    );
  });
});

describe('_string.indexOf', () => {
  const methodName = 'indexOf';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'e'],
        methodName,
      })
    ).toEqual(4);
    expect(
      string({
        params: ['abcdef', 'x'],
        methodName,
      })
    ).toEqual(-1);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
      })
    ).toEqual(-1);
    expect(
      string({
        params: { on: 'abcdef', searchValue: 'ef', fromIndex: 4 },
        methodName,
      })
    ).toEqual(4);
    expect(
      string({
        params: { on: 'abcdef', searchValue: 'a' },
        methodName,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.indexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.indexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.indexOf accepts one of the following types: array, object."`
    );
  });
});

describe('_string.lastIndexOf', () => {
  const methodName = 'lastIndexOf';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e'],
        methodName,
      })
    ).toEqual(6);
    expect(
      string({
        params: ['abcdef', 'c', 3],
        methodName,
      })
    ).toEqual(2);
    expect(
      string({
        params: { on: 'abcdefe', searchValue: 'ef', fromIndex: 3 },
        methodName,
      })
    ).toEqual(-1);
    expect(
      string({
        params: { on: 'abcdef', searchValue: 'a' },
        methodName,
      })
    ).toEqual(0);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.lastIndexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.lastIndexOf must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.lastIndexOf accepts one of the following types: array, object."`
    );
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
        })
      )
    ).toEqual(JSON.stringify(['e']));
    expect(
      JSON.stringify(
        string({
          params: [null, 'e'],
          methodName,
        })
      )
    ).toEqual(JSON.stringify(null));
    expect(
      string({
        params: ['abcdefe', '/e/g'],
        methodName,
      })
    ).toStrictEqual(null); // regex only work on named args
    expect(
      JSON.stringify(
        string({
          params: ['abcdef', 'c'],
          methodName,
        })
      )
    ).toStrictEqual(JSON.stringify(['c']));
    expect(
      JSON.stringify(
        string({
          params: { on: 'abcdef', regex: 'ef' },
          methodName,
        })
      )
    ).toStrictEqual(JSON.stringify(['ef']));
    expect(
      JSON.stringify(
        string({
          params: { on: 'abcdefE', regex: 'e', regexFlags: 'gi' },
          methodName,
        })
      )
    ).toStrictEqual(JSON.stringify(['e', 'E']));
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.match must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.match must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.match accepts one of the following types: array, object."`
    );
  });
});

describe('_string.normalize', () => {
  const methodName = 'normalize';
  test('valid', () => {
    expect(
      string({
        params: ['\u0041\u006d\u00e9\u006c\u0069\u0065'],
        methodName,
      })
    ).toEqual('Amélie');
    expect(
      string({
        params: { on: '\u0041\u006d\u00e9\u006c\u0069\u0065' },
        methodName,
      })
    ).toEqual('Amélie');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: ['\u0041\u006d\u00e9\u006c\u0069\u0065', 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.normalize - The normalization form should be one of NFC, NFD, NFKC, NFKD."`
    );
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.normalize must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.normalize must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.normalize accepts one of the following types: array, object."`
    );
  });
});

describe('_string.padEnd', () => {
  const methodName = 'padEnd';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 10, '_'],
        methodName,
      })
    ).toEqual('abcdef____');
    expect(
      string({
        params: ['abcdef', 8],
        methodName,
      })
    ).toEqual('abcdef  ');
    expect(
      string({
        params: { on: 'abcdef', targetLength: 10, padString: '.' },
        methodName,
      })
    ).toEqual('abcdef....');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.padEnd must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.padEnd must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.padEnd accepts one of the following types: array, object."`
    );
  });
});

describe('_string.padStart', () => {
  const methodName = 'padStart';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 10],
        methodName,
      })
    ).toEqual('    abcdef');
    expect(
      string({
        params: ['abcdef', 8, '_'],
        methodName,
      })
    ).toEqual('__abcdef');
    expect(
      string({
        params: { on: 'abcdef', targetLength: 10, padString: '.' },
        methodName,
      })
    ).toEqual('....abcdef');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.padStart must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.padStart must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.padStart accepts one of the following types: array, object."`
    );
  });
});

describe('_string.repeat', () => {
  const methodName = 'repeat';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 3],
        methodName,
      })
    ).toEqual('abcdefabcdefabcdef');
    expect(
      string({
        params: { on: 'abcdef', count: 3 },
        methodName,
      })
    ).toEqual('abcdefabcdefabcdef');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.repeat must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.repeat must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.repeat accepts one of the following types: array, object."`
    );
  });
});

describe('_string.replace', () => {
  const methodName = 'replace';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e', '_'],
        methodName,
      })
    ).toEqual('abcd_fe');
    expect(
      string({
        params: { on: 'abcdefef', regex: 'ef', newSubstr: '.' },
        methodName,
      })
    ).toEqual('abcd.ef');
    expect(
      string({
        params: { on: 'abcdefef', regex: 'ef', newSubstr: '.', regexFlags: 'g' },
        methodName,
      })
    ).toEqual('abcd..');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.replace must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.replace must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.replace accepts one of the following types: array, object."`
    );
  });
});

describe('_string.search', () => {
  const methodName = 'search';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e'],
        methodName,
      })
    ).toEqual(4);
    expect(
      string({
        params: { on: 'abcdef', regex: 'ef' },
        methodName,
      })
    ).toEqual(4);
    expect(
      string({
        params: { on: 'abcdeaf', regex: 'a', regexFlags: 'g' },
        methodName,
      })
    ).toEqual(0);
    expect(
      string({
        params: { on: 'abcdeaf', regex: 'x' },
        methodName,
      })
    ).toEqual(-1);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.search must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.search must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.search accepts one of the following types: array, object."`
    );
  });
});

describe('_string.slice', () => {
  const methodName = 'slice';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 2, 4],
        methodName,
      })
    ).toEqual('cd');
    expect(
      string({
        params: ['abcdefe', 3],
        methodName,
      })
    ).toEqual('defe');
    expect(
      string({
        params: { on: 'abcdef', start: 1 },
        methodName,
      })
    ).toEqual('bcdef');
    expect(
      string({
        params: { on: 'abcdeaf', start: 2, end: 4 },
        methodName,
      })
    ).toEqual('cd');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.slice must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.slice must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.slice accepts one of the following types: array, object."`
    );
  });
});

describe('_string.split', () => {
  const methodName = 'split';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 'e'],
        methodName,
      })
    ).toEqual(['abcd', 'f', '']);
    expect(
      string({
        params: ['abcdefe', 'de'],
        methodName,
      })
    ).toEqual(['abc', 'fe']);
    expect(
      string({
        params: { on: 'abcdefe', separator: 'e' },
        methodName,
      })
    ).toEqual(['abcd', 'f', '']);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.split must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.split must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.split accepts one of the following types: array, object."`
    );
  });
});

describe('_string.startsWith', () => {
  const methodName = 'startsWith';
  test('valid', () => {
    expect(
      string({
        params: ['abcdef', 'ab'],
        methodName,
      })
    ).toEqual(true);
    expect(
      string({
        params: ['abcdef', 'c'],
        methodName,
      })
    ).toEqual(false);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'ef', position: 4 },
        methodName,
      })
    ).toEqual(true);
    expect(
      string({
        params: { on: 'abcdef', searchString: 'a' },
        methodName,
      })
    ).toEqual(true);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.startsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.startsWith must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.startsWith accepts one of the following types: array, object."`
    );
  });
});

describe('_string.substring', () => {
  const methodName = 'substring';
  test('valid', () => {
    expect(
      string({
        params: ['abcdefe', 2, 4],
        methodName,
      })
    ).toEqual('cd');
    expect(
      string({
        params: ['abcdefe', 3],
        methodName,
      })
    ).toEqual('defe');
    expect(
      string({
        params: { on: 'abcdef', start: 1 },
        methodName,
      })
    ).toEqual('bcdef');
    expect(
      string({
        params: { on: 'abcdeaf', start: 2, end: 4 },
        methodName,
      })
    ).toEqual('cd');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.substring must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: { on: true },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.substring must be evaluated on an string instance. For named args provide an string instance to the \\"on\\" property, for listed args provide and string instance as the first element in the operator argument array."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.substring accepts one of the following types: array, object."`
    );
  });
});

describe('_string.toLowerCase', () => {
  const methodName = 'toLowerCase';
  test('valid', () => {
    expect(
      string({
        params: 'AbC',
        methodName,
      })
    ).toEqual('abc');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toLowerCase accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: ['abc'],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toLowerCase accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toLowerCase accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toLowerCase accepts one of the following types: string."`
    );
  });
});

describe('_string.toUpperCase', () => {
  const methodName = 'toUpperCase';
  test('valid', () => {
    expect(
      string({
        params: 'abC',
        methodName,
      })
    ).toEqual('ABC');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toUpperCase accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: ['abc'],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toUpperCase accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toUpperCase accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.toUpperCase accepts one of the following types: string."`
    );
  });
});

describe('_string.trim', () => {
  const methodName = 'trim';
  test('valid', () => {
    expect(
      string({
        params: '  abc    ',
        methodName,
      })
    ).toEqual('abc');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trim accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: ['abc'],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trim accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trim accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trim accepts one of the following types: string."`
    );
  });
});

describe('_string.trimEnd', () => {
  const methodName = 'trimEnd';
  test('valid', () => {
    expect(
      string({
        params: '  abc    ',
        methodName,
      })
    ).toEqual('  abc');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimEnd accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: ['abc'],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimEnd accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimEnd accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimEnd accepts one of the following types: string."`
    );
  });
});

describe('_string.trimStart', () => {
  const methodName = 'trimStart';
  test('valid', () => {
    expect(
      string({
        params: '  abc    ',
        methodName,
      })
    ).toEqual('abc    ');
  });
  test('throw', () => {
    expect(() =>
      string({
        params: [1, 2],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimStart accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: ['abc'],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimStart accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: { on: 'abc' },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimStart accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.trimStart accepts one of the following types: string."`
    );
  });
});

describe('_string.length', () => {
  const methodName = 'length';
  test('valid', () => {
    expect(
      string({
        params: 'abcde',
        methodName,
      })
    ).toEqual(5);
  });
  test('throw', () => {
    expect(() =>
      string({
        params: { on: '231' },
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.length accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: ['1'],
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.length accepts one of the following types: string."`
    );
    expect(() =>
      string({
        params: null,
        methodName,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"_string.length accepts one of the following types: string."`
    );
  });
});

test('_string called with no method or params', () => {
  expect(() => string({ location: 'location' })).toThrowErrorMatchingInlineSnapshot(
    `"_string.undefined is not supported, use one of the following: charAt, concat, endsWith, includes, indexOf, lastIndexOf, match, normalize, padEnd, padStart, repeat, replace, search, slice, split, startsWith, substring, toLowerCase, toUpperCase, trim, trimEnd, trimStart, length."`
  );
});

test('_string invalid method', () => {
  expect(() =>
    string({ params: ['a'], methodName: 'X', location: 'location' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"_string.X is not supported, use one of the following: charAt, concat, endsWith, includes, indexOf, lastIndexOf, match, normalize, padEnd, padStart, repeat, replace, search, slice, split, startsWith, substring, toLowerCase, toUpperCase, trim, trimEnd, trimStart, length."`
  );
});
