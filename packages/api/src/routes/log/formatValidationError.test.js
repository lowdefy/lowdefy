/*
  Copyright 2020-2026 Lowdefy, Inc

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

import formatValidationError from './formatValidationError.js';

test('formats type error', () => {
  const result = formatValidationError({
    ajvError: {
      keyword: 'type',
      instancePath: '/title',
      message: 'must be string',
      params: { type: 'string' },
    },
    pluginLabel: 'Block',
    typeName: 'Button',
    fieldLabel: 'property',
  });
  expect(result).toBe('Block "Button" property "title" must be type "string".');
});

test('formats enum error', () => {
  const result = formatValidationError({
    ajvError: {
      keyword: 'enum',
      instancePath: '/size',
      message: 'must be equal to one of the allowed values',
      params: { allowedValues: ['small', 'default', 'large'] },
    },
    pluginLabel: 'Block',
    typeName: 'Button',
    fieldLabel: 'property',
  });
  expect(result).toBe(
    'Block "Button" property "size" must be one of ["small","default","large"].'
  );
});

test('formats additionalProperties error', () => {
  const result = formatValidationError({
    ajvError: {
      keyword: 'additionalProperties',
      instancePath: '',
      message: 'must NOT have additional properties',
      params: { additionalProperty: 'colour' },
    },
    pluginLabel: 'Action',
    typeName: 'SetState',
    fieldLabel: 'param',
  });
  expect(result).toBe('Action "SetState" param "colour" is not allowed.');
});

test('formats required error', () => {
  const result = formatValidationError({
    ajvError: {
      keyword: 'required',
      instancePath: '',
      message: "must have required property 'url'",
      params: { missingProperty: 'url' },
    },
    pluginLabel: 'Connection',
    typeName: 'AxiosHttp',
    fieldLabel: 'property',
  });
  expect(result).toBe('Connection "AxiosHttp" required property "url" is missing.');
});

test('formats default case with unknown keyword', () => {
  const result = formatValidationError({
    ajvError: {
      keyword: 'minLength',
      instancePath: '/name',
      message: 'must NOT have fewer than 3 characters',
      params: { limit: 3 },
    },
    pluginLabel: 'Operator',
    typeName: '_custom',
    fieldLabel: 'param',
  });
  expect(result).toBe('Operator "_custom" param "name" must NOT have fewer than 3 characters.');
});

test('handles nested instancePath', () => {
  const result = formatValidationError({
    ajvError: {
      keyword: 'type',
      instancePath: '/options/behavior',
      message: 'must be string',
      params: { type: 'string' },
    },
    pluginLabel: 'Block',
    typeName: 'Select',
    fieldLabel: 'property',
  });
  expect(result).toBe('Block "Select" property "options.behavior" must be type "string".');
});

test('uses missingProperty as fallback fieldName when instancePath is empty', () => {
  const result = formatValidationError({
    ajvError: {
      keyword: 'required',
      instancePath: '',
      message: "must have required property 'collection'",
      params: { missingProperty: 'collection' },
    },
    pluginLabel: 'Request',
    typeName: 'MongoDBFind',
    fieldLabel: 'property',
  });
  expect(result).toBe('Request "MongoDBFind" required property "collection" is missing.');
});
