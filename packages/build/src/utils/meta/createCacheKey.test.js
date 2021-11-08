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

import createCacheKey from './createCacheKey.js';

test('createCacheKey converts a url to a file safe string', () => {
  const location = {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@1.0.0/dist/Button.json',
  };
  expect(createCacheKey(location)).toEqual(
    'https___unpkg_com__lowdefy_blocks-antd_1_0_0_dist_button.json'
  );
});

test('createCacheKey replaces semantic versioning special characters', () => {
  const location = {
    url: '^~*',
  };
  expect(createCacheKey(location)).toEqual('_caret__tilde__star_');
});

test('createCacheKey semantic versioning special characters do not clash', () => {
  const locationCaret = {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@^1.0.0/dist/button.json',
  };
  const locationTilde = {
    url: 'https://unpkg.com/@lowdefy/blocks-antd@~1.0.0/dist/button.json',
  };
  expect(createCacheKey(locationCaret)).toEqual(
    'https___unpkg_com__lowdefy_blocks-antd__caret_1_0_0_dist_button.json'
  );
  expect(createCacheKey(locationTilde)).toEqual(
    'https___unpkg_com__lowdefy_blocks-antd__tilde_1_0_0_dist_button.json'
  );
});

test('createCacheKey converts to lowercase', () => {
  const location = {
    url: 'UPPERCASE',
  };
  expect(createCacheKey(location)).toEqual('uppercase');
});

test('createCacheKey converts all non alphanumerics', () => {
  const location = {
    url: `!@#$%&()+=±§[]{};:"'\\|\`,.<>/?`,
  };
  expect(createCacheKey(location)).toEqual('_____________________________');
});

test('createCacheKey only replaces _json at then end of the string', () => {
  const location = {
    url: 'ABC$jsonDEF.jsonHIJ.json',
  };
  expect(createCacheKey(location)).toEqual('abc_jsondef_jsonhij.json');
});

test('createCacheKey throws if location is undefined', () => {
  expect(() => createCacheKey()).toThrow('Failed to create cache key, location is undefined.');
});

test('createCacheKey throws if location url is not a string', () => {
  expect(() => createCacheKey({ url: 1 })).toThrow('Location url definition should be a string.');
});
