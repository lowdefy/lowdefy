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

import formatValidationError from './formatValidationError.js';

describe('formatValidationError - block errors', () => {
  test('formats type error for block property', () => {
    const result = formatValidationError({
      err: {
        keyword: 'type',
        instancePath: '/content',
        params: { type: 'string' },
      },
      pluginLabel: 'Block',
      pluginName: 'Box',
      fieldLabel: 'property',
      data: { content: 123 },
    });
    expect(result).toBe(
      'Block "Box" property "content" must be type "string". Received 123 (number).'
    );
  });

  test('formats additionalProperties error for block', () => {
    const result = formatValidationError({
      err: {
        keyword: 'additionalProperties',
        instancePath: '',
        params: { additionalProperty: 'unknownProp' },
      },
      pluginLabel: 'Block',
      pluginName: 'Box',
      fieldLabel: 'property',
      data: { unknownProp: true },
    });
    expect(result).toBe('Block "Box" property "unknownProp" is not allowed.');
  });

  test('formats required error for block', () => {
    const result = formatValidationError({
      err: {
        keyword: 'required',
        instancePath: '',
        params: { missingProperty: 'title' },
      },
      pluginLabel: 'Block',
      pluginName: 'Title',
      fieldLabel: 'property',
      data: {},
    });
    expect(result).toBe('Block "Title" required property "title" is missing.');
  });

  test('formats enum error for block', () => {
    const result = formatValidationError({
      err: {
        keyword: 'enum',
        instancePath: '/size',
        params: { allowedValues: ['small', 'medium', 'large'] },
      },
      pluginLabel: 'Block',
      pluginName: 'Button',
      fieldLabel: 'property',
      data: { size: 'huge' },
    });
    expect(result).toBe(
      'Block "Button" property "size" must be one of ["small", "medium", "large"]. Received "huge".'
    );
  });

  test('formats generic error for block', () => {
    const result = formatValidationError({
      err: {
        keyword: 'minimum',
        instancePath: '/width',
        message: 'must be >= 0',
      },
      pluginLabel: 'Block',
      pluginName: 'Box',
      fieldLabel: 'property',
      data: { width: -1 },
    });
    expect(result).toBe('Block "Box" property "width" must be >= 0. Received -1.');
  });
});

describe('formatValidationError - action errors', () => {
  test('formats type error for action param', () => {
    const result = formatValidationError({
      err: {
        keyword: 'type',
        instancePath: '/ms',
        params: { type: 'integer' },
      },
      pluginLabel: 'Action',
      pluginName: 'Wait',
      fieldLabel: 'param',
      data: { ms: 'abc' },
    });
    expect(result).toBe(
      'Action "Wait" param "ms" must be type "integer". Received "abc" (string).'
    );
  });

  test('formats type error with null value', () => {
    const result = formatValidationError({
      err: {
        keyword: 'type',
        instancePath: '/ms',
        params: { type: 'integer' },
      },
      pluginLabel: 'Action',
      pluginName: 'Wait',
      fieldLabel: 'param',
      data: { ms: null },
    });
    expect(result).toBe('Action "Wait" param "ms" must be type "integer". Received null (null).');
  });

  test('formats enum error for action', () => {
    const result = formatValidationError({
      err: {
        keyword: 'enum',
        instancePath: '/responseFunction',
        params: { allowedValues: ['json', 'text', 'blob'] },
      },
      pluginLabel: 'Action',
      pluginName: 'Fetch',
      fieldLabel: 'param',
      data: { responseFunction: 'xml' },
    });
    expect(result).toBe(
      'Action "Fetch" param "responseFunction" must be one of ["json", "text", "blob"]. Received "xml".'
    );
  });

  test('formats additionalProperties error for action', () => {
    const result = formatValidationError({
      err: {
        keyword: 'additionalProperties',
        instancePath: '',
        params: { additionalProperty: 'extra' },
      },
      pluginLabel: 'Action',
      pluginName: 'Wait',
      fieldLabel: 'param',
      data: { ms: 1000, extra: true },
    });
    expect(result).toBe('Action "Wait" param "extra" is not allowed.');
  });

  test('formats required error for action', () => {
    const result = formatValidationError({
      err: {
        keyword: 'required',
        instancePath: '',
        params: { missingProperty: 'ms' },
      },
      pluginLabel: 'Action',
      pluginName: 'Wait',
      fieldLabel: 'param',
      data: {},
    });
    expect(result).toBe('Action "Wait" required param "ms" is missing.');
  });

  test('formats generic error for action', () => {
    const result = formatValidationError({
      err: {
        keyword: 'minimum',
        instancePath: '/ms',
        message: 'must be >= 0',
      },
      pluginLabel: 'Action',
      pluginName: 'Wait',
      fieldLabel: 'param',
      data: { ms: -1 },
    });
    expect(result).toBe('Action "Wait" param "ms" must be >= 0. Received -1.');
  });

  test('formats nested path error for action', () => {
    const result = formatValidationError({
      err: {
        keyword: 'type',
        instancePath: '/options/behavior',
        params: { type: 'string' },
      },
      pluginLabel: 'Action',
      pluginName: 'ScrollTo',
      fieldLabel: 'param',
      data: { options: { behavior: 123 } },
    });
    expect(result).toBe(
      'Action "ScrollTo" param "options.behavior" must be type "string". Received 123 (number).'
    );
  });
});
