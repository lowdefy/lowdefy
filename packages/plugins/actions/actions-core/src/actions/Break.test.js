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

import Break from './Break.js';

const methods = {
  breakActionChain: (message) => {
    throw new Error(message);
  },
};

test('BreakBreak no params', () => {
  expect(() => Break({ methods })).toThrow('Break action params should be an object.');
});

test('Break params.break should be a boolean.', () => {
  expect(() => Break({ methods, params: { break: 'invalid' } })).toThrow(
    'Break action "break" param should be an boolean.'
  );
});

test('Break params.break null', () => {
  expect(() => Break({ methods, params: { break: null } })).not.toThrow();
});

test('Break params.break false', () => {
  expect(() => Break({ methods, params: { break: false } })).not.toThrow();
});

test('Break params.break true, no message', () => {
  const params = { break: true };
  expect(() => Break({ methods, params })).toThrow(Error);
  let error;
  try {
    Break({ methods, params });
  } catch (e) {
    error = e;
  }
  expect(error.message).toEqual('');
});

test('Break params.break true, message', () => {
  const params = { break: true, message: 'My error message' };
  expect(() => Break({ methods, params })).toThrow(Error);
  let error;
  try {
    Break({ methods, params });
  } catch (e) {
    error = e;
  }
  expect(error.message).toEqual('My error message');
});
