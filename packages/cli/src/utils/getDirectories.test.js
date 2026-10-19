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

import path from 'path';

import getDirectories from './getDirectories.js';

// getDirectories receives the config directory already resolved (startUp), and
// resolves or joins every other directory, so the expected values are built
// with path too: drive letter and separators on Windows, the same strings on
// POSIX.
const configDirectory = path.resolve('/test/config');

test('default directories', () => {
  const directories = getDirectories({
    configDirectory,
    options: {},
  });

  expect(directories).toEqual({
    build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
    config: configDirectory,
    dev: path.join(configDirectory, '.lowdefy', 'dev'),
    emails: path.join(configDirectory, '.lowdefy', 'emails'),
    journeys: path.join(configDirectory, 'tests', 'journeys'),
    server: path.join(configDirectory, '.lowdefy', 'server'),
    test: path.join(configDirectory, '.lowdefy', 'test'),
    traces: path.join(configDirectory, '.lowdefy', 'traces'),
  });
});

test('specify serverDirectory in options', () => {
  const directories = getDirectories({
    configDirectory,
    options: {
      serverDirectory: '/test/server',
    },
  });

  expect(directories).toEqual({
    build: path.resolve('/test/server/build'),
    config: configDirectory,
    dev: path.join(configDirectory, '.lowdefy', 'dev'),
    emails: path.join(configDirectory, '.lowdefy', 'emails'),
    journeys: path.join(configDirectory, 'tests', 'journeys'),
    server: path.resolve('/test/server'),
    test: path.join(configDirectory, '.lowdefy', 'test'),
    traces: path.join(configDirectory, '.lowdefy', 'traces'),
  });
});

test('specify devDirectory in options', () => {
  const directories = getDirectories({
    configDirectory,
    options: {
      devDirectory: '/test/dev',
    },
  });

  expect(directories).toEqual({
    build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
    config: configDirectory,
    dev: path.resolve('/test/dev'),
    emails: path.join(configDirectory, '.lowdefy', 'emails'),
    journeys: path.join(configDirectory, 'tests', 'journeys'),
    server: path.join(configDirectory, '.lowdefy', 'server'),
    test: path.join(configDirectory, '.lowdefy', 'test'),
    traces: path.join(configDirectory, '.lowdefy', 'traces'),
  });
});

test('specify journeysDirectory in options', () => {
  const directories = getDirectories({
    configDirectory,
    options: {
      journeysDirectory: '/test/config/tests/auth-journeys',
    },
  });

  expect(directories.journeys).toEqual(path.resolve('/test/config/tests/auth-journeys'));
});
