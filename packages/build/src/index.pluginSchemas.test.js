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
  tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-schemas-build-'));
});

afterAll(() => {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

const metas = {
  Title: {
    category: 'display',
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        content: { type: 'string' },
        level: { type: 'number' },
      },
    },
  },
};

const schemas = {
  SetState: {
    params: {
      type: 'object',
      required: ['message'],
      properties: { message: { type: 'string' } },
    },
  },
  _if: {
    params: {
      type: 'object',
      required: ['test'],
      properties: { test: { type: 'boolean' }, then: {}, else: {} },
      additionalProperties: false,
    },
  },
};

// A plugin package in the server's node_modules that owns Title, SetState and
// the client _if, with the schemas above.
function writeFixture({ name, config, checks, badTitleSchema = false }) {
  const packageName = `@lowdefy-test/schemas-${name}`;
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
  const exports = { './metas': './metas.js', './schemas': './schemas.js' };
  if (checks) {
    exports['./checks'] = './checks.js';
    fs.writeFileSync(path.join(pkgDir, 'checks.js'), `export default ${JSON.stringify(checks)};\n`);
  }
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, type: 'module', exports })
  );
  fs.writeFileSync(
    path.join(pkgDir, 'metas.js'),
    `export const Title = ${JSON.stringify(
      badTitleSchema
        ? {
            ...metas.Title,
            properties: { type: 'object', properties: { content: { pattern: '(' } } },
          }
        : metas.Title
    )};\n`
  );
  fs.writeFileSync(
    path.join(pkgDir, 'schemas.js'),
    `export const SetState = ${JSON.stringify(
      schemas.SetState
    )};\nexport const _if = ${JSON.stringify(schemas._if)};\n`
  );
  return { configDir, serverDir, packageName };
}

function display(line) {
  const message = errorToDisplayString({
    name: line.err.name,
    message: line.msg,
    checkSlug: line.err.checkSlug,
  });
  return `${line.err.source?.split(path.sep).join('/') ?? ''}\n${message}`;
}

async function runFixture({ name, config, checks, skipPluginChecks = false, badTitleSchema }) {
  const { configDir, serverDir, packageName } = writeFixture({
    name,
    config,
    checks,
    badTitleSchema,
  });
  const { logger, lines } = createTestLogger();
  const typesMap = {
    ...testTypesMap,
    blocks: { ...testTypesMap.blocks, Title: { package: packageName } },
    actions: { ...testTypesMap.actions, SetState: { package: packageName } },
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
      skipPluginChecks,
      stage: 'prod',
      validateOnly: true,
    });
  } catch (error) {
    thrownError = error;
  }
  const schemaLines = lines.filter((line) => line.err?.checkSlug === 'plugin-schema');
  return {
    thrownError,
    errors: schemaLines.filter((line) => line.level >= 50).map(display),
    warnings: schemaLines.filter((line) => line.level === 40).map(display),
  };
}

// Runtime values, so precomputeRuntimeOperators leaves the _if in place.
const brokenConfig = `lowdefy: local
pages:
  - id: home
    type: Box
    blocks:
      - id: title
        type: Title
        properties:
          content:
            _state: content
          levle: 2
        events:
          onClick:
            - id: set
              type: SetState
              params:
                text:
                  _state: text
      - id: other
        type: Title
        properties:
          content:
            _if:
              then:
                _state: a
              else: b
`;

test('build warns for each block property, action param and operator param that breaks its plugin schema', async () => {
  const { thrownError, warnings, errors } = await runFixture({
    name: 'warns',
    config: brokenConfig,
  });

  expect(thrownError).toBe(null);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([
    expect.stringMatching(
      /lowdefy\.yaml:8\n\[ConfigWarning · plugin-schema\] Block "Title" property "levle" is not allowed\.$/
    ),
    expect.stringMatching(
      /lowdefy\.yaml:16\n\[ConfigWarning · plugin-schema\] Action "SetState" required param "message" is missing\.$/
    ),
    expect.stringMatching(
      /lowdefy\.yaml:23\n\[ConfigWarning · plugin-schema\] Operator "_if" required param "test" is missing\.$/
    ),
  ]);
});

test('build fails on schema findings of a plugin whose ./checks sets schemaLevel error', async () => {
  const { thrownError, errors } = await runFixture({
    name: 'errors',
    config: brokenConfig,
    checks: { schemaLevel: 'error' },
  });

  expect(thrownError?.message).toBe('Build failed with 3 error(s). See above for details.');
  expect(errors).toHaveLength(3);
  expect(errors[0]).toContain('[ConfigError · plugin-schema] Block "Title" property "levle"');
});

test('build gives no schema findings under ~ignoreBuildChecks: [plugin-schema]', async () => {
  const { thrownError, warnings } = await runFixture({
    name: 'ignored',
    checks: { schemaLevel: 'error' },
    config: `lowdefy: local
pages:
  - id: home
    type: Box
    ~ignoreBuildChecks:
      - plugin-schema
    blocks:
      - id: title
        type: Title
        properties:
          levle: 2
`,
  });

  expect(thrownError).toBe(null);
  expect(warnings).toEqual([]);
});

test('build gives no schema findings with skipPluginChecks', async () => {
  const { thrownError, warnings, errors } = await runFixture({
    name: 'skipped',
    config: brokenConfig,
    checks: { schemaLevel: 'error' },
    skipPluginChecks: true,
  });

  expect(thrownError).toBe(null);
  expect(warnings).toEqual([]);
  expect(errors).toEqual([]);
});

test('build refuses a ./checks schemaLevel that is not error or warning', async () => {
  const { thrownError } = await runFixture({
    name: 'bad-level',
    config: brokenConfig,
    checks: { schemaLevel: 'fatal' },
  });

  expect(thrownError?.message).toMatch(/Build failed/);
});

test('build reports a plugin schema that cannot compile, naming the type and package', async () => {
  const { thrownError, warnings } = await runFixture({
    name: 'bad-schema',
    config: brokenConfig,
    badTitleSchema: true,
  });

  expect(thrownError).toBe(null);
  expect(warnings).toContainEqual(
    expect.stringMatching(
      /\[ConfigWarning · plugin-schema\] Block "Title" schema \(@lowdefy-test\/schemas-bad-schema\) could not be checked: /
    )
  );
});
