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

import { Throw, ThrowActionError } from './Throw.js';

const methods = { getBlockId: () => 'blockId', getPageId: () => 'pageId' };

test('Throw no params', () => {
  expect(() => Throw({ methods })).toThrow(
    'Throw action params should be an object. Received "undefined".'
  );
});

test('Throw params.throw should be a boolean.', () => {
  expect(() => Throw({ methods, params: { throw: 'invalid' } })).toThrow(
    'Throw action "throw" param should be an boolean. Received ""invalid"".'
  );
});

test('Throw params.throw null', () => {
  expect(() => Throw({ methods, params: { throw: null } })).not.toThrow();
});

test('Throw params.throw false', () => {
  expect(() => Throw({ methods, params: { throw: false } })).not.toThrow();
});

test('Throw params.throw true, no message or metaData', () => {
  const params = { throw: true };
  expect(() => Throw({ methods, params })).toThrow(ThrowActionError);
  let error;
  try {
    Throw({ methods, params });
  } catch (e) {
    error = e;
  }
  expect(error.message).toEqual('');
  expect(error.blockId).toEqual('blockId');
  expect(error.metaData).toEqual(undefined);
  expect(error.pageId).toEqual('pageId');
});

test('Throw params.throw true, message and  no metaData', () => {
  const params = { throw: true, message: 'My error message' };
  expect(() => Throw({ methods, params })).toThrow(ThrowActionError);
  let error;
  try {
    Throw({ methods, params });
  } catch (e) {
    error = e;
  }
  expect(error.message).toEqual('My error message');
  expect(error.blockId).toEqual('blockId');
  expect(error.metaData).toEqual(undefined);
  expect(error.pageId).toEqual('pageId');
});

test('Throw params.throw true, message and  metaData string', () => {
  const params = { throw: true, message: 'My error message', metaData: 'Meta string' };
  expect(() => Throw({ methods, params })).toThrow(ThrowActionError);
  let error;
  try {
    Throw({ methods, params });
  } catch (e) {
    error = e;
  }
  expect(error.message).toEqual('My error message');
  expect(error.blockId).toEqual('blockId');
  expect(error.metaData).toEqual('Meta string');
  expect(error.pageId).toEqual('pageId');
});

test('Throw params.throw true, message and metaData object', () => {
  const params = { throw: true, message: 'My error message', metaData: { key: 'value' } };
  expect(() => Throw({ methods, params })).toThrow(ThrowActionError);
  let error;
  try {
    Throw({ methods, params });
  } catch (e) {
    error = e;
  }
  expect(error.message).toEqual('My error message');
  expect(error.blockId).toEqual('blockId');
  expect(error.metaData).toEqual({ key: 'value' });
  expect(error.pageId).toEqual('pageId');
});
