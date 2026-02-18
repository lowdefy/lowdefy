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

import extractErrorProps from './extractErrorProps.js';

test('extractErrorProps extracts basic error properties', () => {
  const err = new Error('test message');
  const props = extractErrorProps(err);
  expect(props.message).toBe('test message');
  expect(props.name).toBe('Error');
  expect(props.stack).toBeDefined();
});

test('extractErrorProps returns falsy input unchanged', () => {
  expect(extractErrorProps(null)).toBeNull();
  expect(extractErrorProps(undefined)).toBeUndefined();
});

test('extractErrorProps extracts custom enumerable properties', () => {
  const err = new Error('test');
  err.code = 'ERR_CUSTOM';
  err.statusCode = 500;
  const props = extractErrorProps(err);
  expect(props.code).toBe('ERR_CUSTOM');
  expect(props.statusCode).toBe(500);
});

test('extractErrorProps recursively serializes Error cause', () => {
  const inner = new Error('inner error');
  inner.code = 'INNER';
  const outer = new Error('outer error', { cause: inner });
  const props = extractErrorProps(outer);
  expect(props.cause).toEqual(
    expect.objectContaining({
      message: 'inner error',
      name: 'Error',
      code: 'INNER',
    })
  );
  expect(props.cause.stack).toBeDefined();
});

test('extractErrorProps handles multi-level cause chain', () => {
  const root = new Error('root');
  const middle = new Error('middle', { cause: root });
  const top = new Error('top', { cause: middle });
  const props = extractErrorProps(top);
  expect(props.message).toBe('top');
  expect(props.cause.message).toBe('middle');
  expect(props.cause.cause.message).toBe('root');
  expect(props.cause.cause.cause).toBeUndefined();
});

test('extractErrorProps preserves non-Error cause as-is', () => {
  const err = new Error('test');
  err.cause = 'string cause';
  const props = extractErrorProps(err);
  expect(props.cause).toBe('string cause');
});
