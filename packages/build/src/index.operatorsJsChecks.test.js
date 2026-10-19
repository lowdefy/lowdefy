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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { errorToDisplayString } from '@lowdefy/errors';

import createTestLogger from './test-utils/createTestLogger.js';
import { testTypesMap } from './test-utils/runBuild.js';

jest.unstable_mockModule('./utils/writeBuildArtifact.js', () => ({
  default: () => jest.fn(),
}));

const { default: build } = await import('./index.js');

// Runs the real @lowdefy/operators-js ./checks, resolved from the build package.

let tempDirectory;

beforeAll(() => {
  tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-operators-js-checks-'));
});

afterAll(() => {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

async function runFixture({ name, config }) {
  const configDir = path.join(tempDirectory, name, 'config');
  const serverDir = path.join(tempDirectory, name, 'server');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(serverDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, 'lowdefy.yaml'), config);
  fs.writeFileSync(
    path.join(serverDir, 'package.json'),
    '{ "name": "server", "dependencies": {} }\n'
  );
  const { logger, lines } = createTestLogger();
  let thrownError = null;
  try {
    await build({
      customTypesMap: testTypesMap,
      directories: {
        config: configDir,
        build: path.join(configDir, '.lowdefy'),
        server: serverDir,
      },
      logger,
      stage: 'prod',
      validateOnly: true,
    });
  } catch (error) {
    thrownError = error;
  }
  const errors = lines
    .filter((line) => line.level >= 50 && line.err)
    .map((line) => {
      const message = errorToDisplayString({
        name: line.err.name,
        message: line.msg,
        checkSlug: line.err.checkSlug,
      });
      return `${line.err.source?.split(path.sep).join('/') ?? ''}\n${message}`;
    });
  return { thrownError, errors };
}

const page = (ignore) => `lowdefy: local
pages:
  - id: home
    type: Box
    blocks:
      - id: one
        type: Title${ignore ? '\n        ~ignoreBuildChecks:\n          - if-test' : ''}
        properties:
          content:
            _if:
              _eq:
                - _state: a
                - 1
              then: a
              else: b
`;

test('an _if with its condition outside test fails the build with if-test', async () => {
  const { thrownError, errors } = await runFixture({ name: 'fails', config: page(false) });
  expect(thrownError?.message).toBe('Build failed with 1 error(s). See above for details.');
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch(/lowdefy\.yaml:9\n/);
  expect(errors[0]).toContain(
    '[ConfigError · if-test] _if has no test key. Put the condition under test:.'
  );
});

test('~ignoreBuildChecks: [if-test] on the block lets the build pass', async () => {
  const { thrownError, errors } = await runFixture({ name: 'ignored', config: page(true) });
  expect(errors).toEqual([]);
  expect(thrownError).toBe(null);
});

test('an _if with test builds', async () => {
  const { thrownError, errors } = await runFixture({
    name: 'valid',
    config: `lowdefy: local
pages:
  - id: home
    type: Box
    blocks:
      - id: one
        type: Title
        properties:
          content:
            _if:
              test:
                _eq:
                  - _state: a
                  - 1
              then: a
              else: b
`,
  });
  expect(errors).toEqual([]);
  expect(thrownError).toBe(null);
});
