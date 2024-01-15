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

import validateConfig from './validateConfig.js';
import testContext from '../test/testContext.js';

const context = testContext();

test('validateConfig no config defined', () => {
  const components = {};
  const result = validateConfig({ components, context });
  expect(result).toEqual({
    config: {},
  });
});

test('validateConfig config not an object', () => {
  const components = {
    config: 'config',
  };
  expect(() => validateConfig({ components, context })).toThrow('lowdefy.config is not an object.');
});

test('validateConfig config error when basePath does not start with "/".', () => {
  let components = {
    config: {
      basePath: '/base',
    },
  };
  const result = validateConfig({ components, context });
  expect(result).toEqual({
    config: {
      basePath: '/base',
    },
  });
  components = {
    config: {
      basePath: 'base',
    },
  };
  expect(() => validateConfig({ components, context })).toThrow('Base path must start with "/".');
});
