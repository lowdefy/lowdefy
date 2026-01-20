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
import _regex from './regex.js';

const location = 'location';

console.error = () => {};

test('_regex with on, pass', () => {
  expect(_regex({ params: { on: 'a', pattern: '^a$' }, location })).toEqual(true);
});
test('_regex with on, fail', () => {
  expect(_regex({ params: { on: 'b', pattern: '^a$' }, location })).toEqual(false);
});
test('_regex with null on', () => {
  expect(_regex({ params: { on: null, pattern: '^a$' }, location })).toEqual(false);
});
test('_regex with on, pass', () => {
  expect(_regex({ params: { on: 'a', pattern: '^a$' }, location })).toEqual(true);
});
test('_regex with key, pass', () => {
  expect(
    _regex({
      params: { key: 'string', pattern: '^Some String$' },
      location,
      state: { string: 'Some String' },
    })
  ).toEqual(true);
});
test('_regex with key, fail', () => {
  expect(
    _regex({
      params: { key: 'string', pattern: '^a$' },
      location,
      state: { string: 'Some String' },
    })
  ).toEqual(false);
});
test('_regex with nonexistent', () => {
  expect(
    _regex({
      params: { key: 'notThere', pattern: '^a$' },
      location,
      state: { string: 'Some String' },
    })
  ).toEqual(false);
});
test('_regex with null key', () => {
  expect(() =>
    _regex({
      params: { key: null, pattern: '^a$' },
      location,
      state: { string: 'Some String' },
    })
  ).toThrow(
    '_regex.key must be a string.'
  );
});
test('_regex null', () => {
  expect(() => _regex({ params: null, location })).toThrow(
    '_regex.pattern must be a string.'
  );
});
test('_regex with non-string on', () => {
  expect(() => _regex({ params: { pattern: '^a$', on: 5 }, location })).toThrow(
    '_regex.on must be a string.'
  );
});
test('_regex flags', () => {
  expect(_regex({ params: { on: 'A', pattern: '^a$', flags: 'i' }, location })).toEqual(true);
});
test('_regex invalid flags', () => {
  expect(() => _regex({ params: { pattern: '^a$', on: 'A', flags: 1 }, location })).toThrow(
    '_regex failed to execute RegExp.test.'
  );
});
