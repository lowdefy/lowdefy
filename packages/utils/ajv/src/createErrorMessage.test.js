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

import createErrorMessage from './createErrorMessage.js';

test('no errors', () => {
  expect(createErrorMessage()).toEqual('Schema validation error.');
  expect(createErrorMessage([])).toEqual('Schema validation error.');
});

test('single error', () => {
  const errors = [
    {
      keyword: 'type',
      dataPath: '/string',
      schemaPath: '#/properties/string/type',
      params: { type: 'string' },
      message: 'should be string',
    },
  ];
  expect(createErrorMessage(errors)).toEqual('should be string');
});

test('two errors', () => {
  const errors = [
    {
      keyword: 'type',
      dataPath: '/string',
      schemaPath: '#/properties/string/type',
      params: { type: 'string' },
      message: 'should be string',
    },
    {
      keyword: 'type',
      dataPath: '/number',
      schemaPath: '#/properties/number/type',
      params: { type: 'number' },
      message: 'should be number',
    },
  ];
  expect(createErrorMessage(errors)).toEqual('should be string; should be number');
});

test('three errors', () => {
  const errors = [
    {
      keyword: 'type',
      dataPath: '/string',
      schemaPath: '#/properties/string/type',
      params: { type: 'string' },
      message: 'should be string',
    },
    {
      keyword: 'type',
      dataPath: '/number',
      schemaPath: '#/properties/number/type',
      params: { type: 'number' },
      message: 'should be number',
    },
    {
      keyword: 'type',
      dataPath: '/boolean',
      schemaPath: '#/properties/boolean/type',
      params: { type: 'boolean' },
      message: 'should be boolean',
    },
  ];
  expect(createErrorMessage(errors)).toEqual('should be string; should be boolean');
});

test('single error, nunjucks template in message', () => {
  const errors = [
    {
      keyword: 'errorMessage',
      dataPath: '/string',
      schemaPath: '#/properties/string/errorMessage',
      message: '{{ keyword }}:{{ dataPath }}:{{ schemaPath }}:{{ message }}',
    },
  ];
  expect(createErrorMessage(errors)).toEqual(
    'errorMessage:/string:#/properties/string/errorMessage:{{ keyword }}:{{ dataPath }}:{{ schemaPath }}:{{ message }}'
  );
});

test('two errors, nunjucks template in message', () => {
  const errors = [
    {
      keyword: 'errorMessage',
      dataPath: '/string',
      schemaPath: '#/properties/string/errorMessage',
      message: '{{ keyword }}:{{ dataPath }}:{{ schemaPath }}:{{ message }}',
    },
    {
      keyword: 'errorMessage',
      dataPath: '/number',
      schemaPath: '#/properties/number/errorMessage',
      message: '{{ keyword }}:{{ dataPath }}:{{ schemaPath }}:{{ message }}',
    },
  ];
  expect(createErrorMessage(errors)).toEqual(
    'errorMessage:/string:#/properties/string/errorMessage:{{ keyword }}:{{ dataPath }}:{{ schemaPath }}:{{ message }}; errorMessage:/number:#/properties/number/errorMessage:{{ keyword }}:{{ dataPath }}:{{ schemaPath }}:{{ message }}'
  );
});
