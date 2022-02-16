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

import getConfigFromEnv from './getConfigFromEnv.js';

const realEnv = process.env;

afterEach(() => {
  process.env = realEnv;
});

test('Get config from env', () => {
  process.env = {
    LOWDEFY_SERVER_BUILD_DIRECTORY: 'build',
    LOWDEFY_SERVER_PUBLIC_DIRECTORY: 'public',
    LOWDEFY_SERVER_PORT: '8080',
    LOWDEFY_BASE_PATH: 'base',
    LOWDEFY_SERVER_LOG_LEVEL: 'verbose',
    OTHER_VAR: 'other',
    ANOTHER_VAR: 'another',
    ASDF_GHJK: 'asdfghjk',
  };
  const config = getConfigFromEnv();
  expect(config).toEqual({
    buildDirectory: 'build',
    logLevel: 'verbose',
    publicDirectory: 'public',
    port: 8080,
    basePath: 'base',
  });
});

test('Return an empty object if no config', () => {
  process.env = {
    OTHER_VAR: 'other',
    ANOTHER_VAR: 'another',
    ASDF_GHJK: 'asdfghjk',
  };
  const config = getConfigFromEnv();
  expect(config).toEqual({});
});
