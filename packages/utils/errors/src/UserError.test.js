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

import UserError from './UserError.js';

test('UserError sets name and isLowdefyError', () => {
  const error = new UserError('Validation failed');
  expect(error.name).toBe('UserError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.message).toBe('Validation failed');
  expect(error instanceof UserError).toBe(true);
  expect(error instanceof Error).toBe(true);
});

test('UserError without options sets fields to undefined', () => {
  const error = new UserError('msg');
  expect(error.blockId).toBeUndefined();
  expect(error.metaData).toBeUndefined();
  expect(error.pageId).toBeUndefined();
  expect(error.cause).toBeUndefined();
});

test('UserError isReject defaults to false', () => {
  const error = new UserError('msg');
  expect(error.isReject).toBe(false);
});

test('UserError sets isReject from options', () => {
  const error = new UserError('msg', { isReject: true });
  expect(error.isReject).toBe(true);
});

test('UserError sets blockId, metaData, pageId from options', () => {
  const error = new UserError('msg', {
    blockId: 'block_a',
    metaData: { foo: 'bar' },
    pageId: 'page_a',
  });
  expect(error.blockId).toBe('block_a');
  expect(error.metaData).toEqual({ foo: 'bar' });
  expect(error.pageId).toBe('page_a');
});

test('UserError forwards cause to super', () => {
  const inner = new Error('inner failure');
  const error = new UserError('outer', { cause: inner });
  expect(error.cause).toBe(inner);
});

test('UserError without cause leaves cause undefined', () => {
  const error = new UserError('msg', { blockId: 'b' });
  expect(error.cause).toBeUndefined();
});

test('UserError with all options', () => {
  const inner = new Error('inner');
  const error = new UserError('outer', {
    blockId: 'block_a',
    isReject: true,
    metaData: { x: 1 },
    pageId: 'page_a',
    cause: inner,
  });
  expect(error.name).toBe('UserError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.message).toBe('outer');
  expect(error.blockId).toBe('block_a');
  expect(error.isReject).toBe(true);
  expect(error.metaData).toEqual({ x: 1 });
  expect(error.pageId).toBe('page_a');
  expect(error.cause).toBe(inner);
});

test('UserError keeps invalidBlocks from options', () => {
  const error = new UserError('msg', { invalidBlocks: ['name', 'email'] });
  expect(error.invalidBlocks).toEqual(['name', 'email']);
});

test('UserError without invalidBlocks leaves invalidBlocks undefined', () => {
  const error = new UserError('msg');
  expect(error.invalidBlocks).toBeUndefined();
});
