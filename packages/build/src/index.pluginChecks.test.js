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

let tempDirectory;

beforeAll(() => {
  tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-checks-build-'));
});

afterAll(() => {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

function writeFixture({ name, config }) {
  const packageName = `@lowdefy-test/rules-${name}`;
  const root = path.join(tempDirectory, name);
  const configDir = path.join(root, 'config');
  const serverDir = path.join(root, 'server');
  const pkgDir = path.join(serverDir, 'node_modules', packageName);
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, 'lowdefy.yaml'), config);
  fs.writeFileSync(
    path.join(serverDir, 'package.json'),
    '{ "name": "server", "dependencies": {} }\n'
  );
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, type: 'module', exports: { './checks': './checks.js' } })
  );
  fs.writeFileSync(
    path.join(pkgDir, 'checks.js'),
    `export default {
  operators: {
    _if: [{
      id: 'if-test',
      level: 'error',
      description: '_if needs test.',
      check: ({ params }) => ('test' in params ? null : '_if has no test key. Put the condition under test:.'),
    }],
  },
};
`
  );
  return { configDir, serverDir, packageName };
}

async function runFixture({ name, config }) {
  const { configDir, serverDir, packageName } = writeFixture({ name, config });
  const { logger, lines } = createTestLogger();
  const typesMap = {
    ...testTypesMap,
    operators: {
      client: { ...testTypesMap.operators.client, _if: { package: packageName } },
      server: testTypesMap.operators.server,
    },
  };
  let thrownError = null;
  try {
    await build({
      customTypesMap: typesMap,
      directories: {
        config: configDir,
        build: path.join(configDir, '.lowdefy'),
        server: serverDir,
      },
      logger,
      stage: 'prod',
      // Every check runs; nothing is written.
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

// Runtime branches, so precomputeRuntimeOperators leaves the _if in place.
test('build fails with the file, line and slug of every broken plugin rule', async () => {
  const { thrownError, errors } = await runFixture({
    name: 'fails',
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
              then:
                _state: a
              else:
                _state: b
      - id: two
        type: Title
        properties:
          content:
            _if:
              then:
                _state: c
              else:
                _state: d
`,
  });

  expect(thrownError?.message).toBe('Build failed with 2 error(s). See above for details.');
  expect(errors).toHaveLength(2);
  expect(errors[0]).toMatch(/lowdefy\.yaml:9\n/);
  expect(errors[0]).toContain('[ConfigError · if-test] _if has no test key.');
  expect(errors[1]).toMatch(/lowdefy\.yaml:18\n/);
});

test('build passes when ~ignoreBuildChecks lists the plugin rule id', async () => {
  const { thrownError } = await runFixture({
    name: 'ignored',
    config: `lowdefy: local
pages:
  - id: home
    type: Box
    blocks:
      - id: one
        type: Title
        ~ignoreBuildChecks:
          - if-test
        properties:
          content:
            _if:
              then:
                _state: a
              else:
                _state: b
`,
  });

  expect(thrownError).toBe(null);
});
