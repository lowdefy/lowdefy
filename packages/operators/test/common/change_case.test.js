/*
  Copyright 2020-2021 Lowdefy, Inc

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

import change_case from '../../src/common/change_case';

const testString = 'test string';

const testArray = ['test string 1', 'test string 2', 'test string 3'];

const testObject = {
  field_1: 'test string 1',
  field_2: 'test string 2',
};

test('_change_case.capitalCase on: string, options: {delimiter: "-"}', () => {
  expect(
    change_case({
      params: {
        on: testString,
        options: {
          delimiter: '-',
        },
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual('Test-String');
});

test('_change_case.capitalCase [string, {delimiter: "-"}]', () => {
  expect(
    change_case({
      params: ['test string', { delimiter: '-' }],
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual('Test-String');
});

test('_change_case.capitalCase on: array, options: {delimiter: "-"}', () => {
  expect(
    change_case({
      params: {
        on: testArray,
        options: {
          delimiter: '-',
        },
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual(['Test-String-1', 'Test-String-2', 'Test-String-3']);
});

test('_change_case.capitalCase on: object, options: {convertKeys: true}', () => {
  expect(
    change_case({
      params: {
        on: testObject,
        options: {
          convertKeys: true,
        },
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual({ 'Field 1': 'Test String 1', 'Field 2': 'Test String 2' });
});

test('_change_case.capitalCase on: object, options: {convertKeys: false}', () => {
  expect(
    change_case({
      params: {
        on: testObject,
        options: {
          convertKeys: false,
        },
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual({ field_1: 'Test String 1', field_2: 'Test String 2' });
});

test('_change_case.capitalCase on: object, options: {}', () => {
  expect(
    change_case({
      params: {
        on: testObject,
        options: {},
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual({ field_1: 'Test String 1', field_2: 'Test String 2' });
});

test('_change_case.capitalCase on: object, options: {convertKeys: true, convertValues: false}', () => {
  expect(
    change_case({
      params: {
        on: testObject,
        options: {
          convertKeys: true,
          convertValues: false,
        },
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual({ 'Field 1': 'test string 1', 'Field 2': 'test string 2' });
});

test('_change_case.capitalCase on: object, options: {convertValues: false}', () => {
  expect(
    change_case({
      params: {
        on: testObject,
        options: {
          convertValues: false,
        },
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual({ field_1: 'test string 1', field_2: 'test string 2' });
});

test('_change_case.capitalCase on: object, options: {convertKeys: true, delimiter: "-" }', () => {
  expect(
    change_case({
      params: {
        on: testObject,
        options: {
          convertKeys: true,
          delimiter: '-',
        },
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual({ 'Field-1': 'Test-String-1', 'Field-2': 'Test-String-2' });
});

test('_change_case.capitalCase on: date', () => {
  expect(
    change_case({
      params: {
        on: new Date('2000-01-01'),
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual(new Date('2000-01-01'));
});

test('_change_case.capitalCase on: array including not numbers', () => {
  expect(
    change_case({
      params: {
        on: ['test string', 1, 'test string 2', { field: 'value' }],
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual(['Test String', 1, 'Test String 2', { field: 'value' }]);
});

// test('_change_case.noCase on: string', () => {
// });

// test('_change_case.paramCase on: string', () => {
// });

// test('_change_case.pascalCase on: string', () => {
// });

// test('_change_case.pathCase on: string', () => {
// });

// test('_change_case.sentenceCase on: string', () => {
// });

// test('_change_case.snakeCase on: string', () => {
// });

test('_change_case.(AllMethods) on: string', () => {
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'camelCase',
    })
  ).toEqual('testString');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual('Test String');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'constantCase',
    })
  ).toEqual('TEST_STRING');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'dotCase',
    })
  ).toEqual('test.string');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'headerCase',
    })
  ).toEqual('Test-String');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'noCase',
    })
  ).toEqual('test string');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'paramCase',
    })
  ).toEqual('test-string');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'pascalCase',
    })
  ).toEqual('TestString');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'pathCase',
    })
  ).toEqual('test/string');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'sentenceCase',
    })
  ).toEqual('Test string');
  expect(
    change_case({
      params: {
        on: testString,
      },
      location: 'locationId',
      methodName: 'snakeCase',
    })
  ).toEqual('test_string');
});

test('_change_case.(AllMethods) on: object', () => {
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'camelCase',
    })
  ).toEqual({ field_1: 'testString_1', field_2: 'testString_2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual({ field_1: 'Test String 1', field_2: 'Test String 2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'constantCase',
    })
  ).toEqual({ field_1: 'TEST_STRING_1', field_2: 'TEST_STRING_2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'dotCase',
    })
  ).toEqual({ field_1: 'test.string.1', field_2: 'test.string.2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'headerCase',
    })
  ).toEqual({ field_1: 'Test-String-1', field_2: 'Test-String-2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'noCase',
    })
  ).toEqual({ field_1: 'test string 1', field_2: 'test string 2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'paramCase',
    })
  ).toEqual({ field_1: 'test-string-1', field_2: 'test-string-2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'pascalCase',
    })
  ).toEqual({ field_1: 'TestString_1', field_2: 'TestString_2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'pathCase',
    })
  ).toEqual({ field_1: 'test/string/1', field_2: 'test/string/2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'sentenceCase',
    })
  ).toEqual({ field_1: 'Test string 1', field_2: 'Test string 2' });
  expect(
    change_case({
      params: {
        on: testObject,
      },
      location: 'locationId',
      methodName: 'snakeCase',
    })
  ).toEqual({ field_1: 'test_string_1', field_2: 'test_string_2' });
});

test('_change_case.(AllMethods) on: array', () => {
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'camelCase',
    })
  ).toEqual(['testString_1', 'testString_2', 'testString_3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'capitalCase',
    })
  ).toEqual(['Test String 1', 'Test String 2', 'Test String 3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'constantCase',
    })
  ).toEqual(['TEST_STRING_1', 'TEST_STRING_2', 'TEST_STRING_3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'dotCase',
    })
  ).toEqual(['test.string.1', 'test.string.2', 'test.string.3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'headerCase',
    })
  ).toEqual(['Test-String-1', 'Test-String-2', 'Test-String-3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'noCase',
    })
  ).toEqual(['test string 1', 'test string 2', 'test string 3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'paramCase',
    })
  ).toEqual(['test-string-1', 'test-string-2', 'test-string-3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'pascalCase',
    })
  ).toEqual(['TestString_1', 'TestString_2', 'TestString_3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'pathCase',
    })
  ).toEqual(['test/string/1', 'test/string/2', 'test/string/3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'sentenceCase',
    })
  ).toEqual(['Test string 1', 'Test string 2', 'Test string 3']);
  expect(
    change_case({
      params: {
        on: testArray,
      },
      location: 'locationId',
      methodName: 'snakeCase',
    })
  ).toEqual(['test_string_1', 'test_string_2', 'test_string_3']);
});
