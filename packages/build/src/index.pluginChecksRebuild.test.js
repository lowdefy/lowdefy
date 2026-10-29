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

import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildBlockSchema } from '@lowdefy/block-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { testTypesMap } from './test-utils/runBuild.js';

const childScript = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'test-utils',
  'buildInChildProcess.js'
);

// The path a fresh `lowdefy build` takes for a plugin outside the server's
// base package.json: the first build cannot load its rules and lists it in
// plugin-checks-pending.json, the CLI installs it, and the second build runs
// its rules. Here the install is writing the package into the server's
// node_modules between the builds.
const packageName = '@lowdefy-test/rules-rebuild';

const config = `lowdefy: local
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
`;

let root;
let directories;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-checks-rebuild-'));
  directories = {
    config: path.join(root, 'config'),
    build: path.join(root, 'server', 'build'),
    server: path.join(root, 'server'),
  };
  fs.mkdirSync(directories.config, { recursive: true });
  fs.mkdirSync(path.join(directories.server, 'public_default'), { recursive: true });
  fs.writeFileSync(path.join(directories.config, 'lowdefy.yaml'), config);
  fs.writeFileSync(
    path.join(directories.server, 'package.json'),
    '{ "name": "server", "dependencies": {} }\n'
  );
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function installPlugin() {
  const pkgDir = path.join(directories.server, 'node_modules', packageName);
  fs.mkdirSync(pkgDir, { recursive: true });
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
      check: ({ params }) => ('test' in params ? null : '_if has no test key.'),
    }],
  },
};
`
  );
}

const pendingPath = () => path.join(directories.build, 'plugin-checks-pending.json');

function runBuild({ customTypesMap, pluginInstallFollows, skipPluginChecks } = {}) {
  const options = {
    customTypesMap: customTypesMap ?? {
      ...testTypesMap,
      operators: {
        client: { ...testTypesMap.operators.client, _if: { package: packageName } },
        server: testTypesMap.operators.server,
      },
    },
    directories,
    pluginInstallFollows,
    skipPluginChecks,
    stage: 'prod',
  };
  const child = spawnSync(process.execPath, [childScript, JSON.stringify(options)], {
    encoding: 'utf8',
  });
  const lines = child.stdout
    .split('\n')
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line));
  return {
    status: child.status,
    errors: lines.filter((line) => line.level >= 50 && line.err).map((line) => line.msg),
    warnings: lines.filter((line) => line.level === 40).map((line) => line.msg),
    lines,
  };
}

test('a build before the install lists the plugin as pending; the build after it runs its rules', () => {
  const first = runBuild();
  expect(first.status).toBe(0);
  expect(first.warnings).toContain(
    `Plugin checks for ${packageName} did not run: package not installed.`
  );
  expect(JSON.parse(fs.readFileSync(pendingPath(), 'utf8'))).toEqual({
    packages: [{ name: packageName, schemaChecked: true }],
  });

  installPlugin();

  const second = runBuild();
  expect(second.status).toBe(1);
  expect(second.errors).toEqual(['_if has no test key.']);
  expect(fs.existsSync(pendingPath())).toBe(false);
});

test('with skipPluginChecks the build after the install passes and warns that rules were skipped', () => {
  runBuild();
  installPlugin();

  const second = runBuild({ skipPluginChecks: true });
  expect(second.status).toBe(0);
  expect(second.warnings).toContain('Plugin checks were skipped (--skip-plugin-checks).');
  expect(fs.existsSync(pendingPath())).toBe(false);
});

test('a build with every used plugin installed passes valid config and writes no pending file', () => {
  fs.writeFileSync(
    path.join(directories.config, 'lowdefy.yaml'),
    config.replace(
      '            _if:\n',
      '            _if:\n              test:\n                _state: c\n'
    )
  );
  installPlugin();
  const { status, warnings } = runBuild();
  expect(status).toBe(0);
  expect(warnings).not.toContain(
    `Plugin checks for ${packageName} did not run: package not installed.`
  );
  expect(fs.existsSync(pendingPath())).toBe(false);
});

// A pending package warns only when its missing checks change something: it
// owns a block, action or operator type, or ships ./checks. A connection-only
// package with no ./checks, such as @lowdefy/connection-mongodb, does not.
describe('pending warnings', () => {
  const connectionPackage = '@lowdefy-test/connection-only';
  const blockPackage = '@lowdefy-test/block-plugin';
  const pendingWarning = (name) => `Plugin checks for ${name} did not run: package not installed.`;

  const typesMap = {
    ...testTypesMap,
    blocks: { ...testTypesMap.blocks, TestCard: { package: blockPackage } },
    connections: { ...testTypesMap.connections, TestConnection: { package: connectionPackage } },
  };

  function writeConfig({ block }) {
    fs.writeFileSync(
      path.join(directories.config, 'lowdefy.yaml'),
      `lowdefy: local
connections:
  - id: db
    type: TestConnection
pages:
  - id: home
    type: Box
    blocks:
${
  block
    ? `      - id: card
        type: TestCard
        properties:
          titel: Hello
`
    : `      - id: one
        type: Title
        properties:
          content: Hello
`
}`
    );
  }

  function installPackage(name, files) {
    const pkgDir = path.join(directories.server, 'node_modules', name);
    fs.mkdirSync(pkgDir, { recursive: true });
    const exports = { './types': './types.js' };
    fs.writeFileSync(path.join(pkgDir, 'types.js'), 'export default {};\n');
    for (const [specifier, [file, content]] of Object.entries(files)) {
      exports[specifier] = `./${file}`;
      fs.writeFileSync(path.join(pkgDir, file), content);
    }
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ name, type: 'module', exports })
    );
  }

  function installConnectionPackage() {
    installPackage(connectionPackage, {});
  }

  function installBlockPackage() {
    installPackage(blockPackage, {
      './metas': [
        'metas.js',
        `export const TestCard = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: { title: { type: 'string' } },
  },
};
`,
      ],
    });
  }

  function build(options) {
    return runBuild({ customTypesMap: typesMap, ...options });
  }

  // The passes `lowdefy build` makes: a build that an install follows, the
  // install, and a second build when the install gives something to check.
  async function lowdefyBuild({ install }) {
    const { pluginChecksNeedRebuild } = await import('@lowdefy/node-utils');
    const first = build({ pluginInstallFollows: true });
    install();
    const rebuild = pluginChecksNeedRebuild({
      buildDirectory: directories.build,
      serverDirectory: directories.server,
    });
    const second = rebuild ? build() : null;
    return { first, second };
  }

  test('a connection-only package with no ./checks gives no warning on a build that never installs', () => {
    writeConfig({ block: false });
    const { status, warnings } = build();
    expect(status).toBe(0);
    expect(warnings).not.toContain(pendingWarning(connectionPackage));
    expect(JSON.parse(fs.readFileSync(pendingPath(), 'utf8'))).toEqual({
      packages: [{ name: connectionPackage, schemaChecked: false }],
    });
  });

  test('a connection-only package with no ./checks gives no warning through lowdefy build', async () => {
    writeConfig({ block: false });
    const { first, second } = await lowdefyBuild({ install: installConnectionPackage });
    expect(first.status).toBe(0);
    expect(first.warnings).not.toContain(pendingWarning(connectionPackage));
    expect(second).toBe(null);
  });

  test('a pending block package warns once on a build that never installs', () => {
    writeConfig({ block: true });
    const { status, warnings } = build();
    expect(status).toBe(0);
    expect(warnings.filter((warning) => warning === pendingWarning(blockPackage))).toHaveLength(1);
    expect(warnings).not.toContain(pendingWarning(connectionPackage));
  });

  test('through lowdefy build a pending block package is schema checked after the install, with no stale warning', async () => {
    writeConfig({ block: true });
    const { first, second } = await lowdefyBuild({
      install: () => {
        installConnectionPackage();
        installBlockPackage();
      },
    });
    expect(first.status).toBe(0);
    expect(first.warnings).not.toContain(pendingWarning(blockPackage));
    expect(second).not.toBe(null);
    expect(second.status).toBe(0);
    expect(second.warnings).not.toContain(pendingWarning(blockPackage));
    expect(second.warnings).not.toContain(pendingWarning(connectionPackage));
    expect(second.warnings.some((warning) => warning.includes('titel'))).toBe(true);
    expect(fs.existsSync(pendingPath())).toBe(false);
  });

  test('through lowdefy build the rebuild warns for a block package the install did not add', async () => {
    writeConfig({ block: true });
    const { first, second } = await lowdefyBuild({ install: installConnectionPackage });
    expect(first.status).toBe(0);
    expect(first.warnings).not.toContain(pendingWarning(blockPackage));
    expect(second).not.toBe(null);
    expect(second.status).toBe(0);
    expect(
      second.warnings.filter((warning) => warning === pendingWarning(blockPackage))
    ).toHaveLength(1);
    expect(second.warnings).not.toContain(pendingWarning(connectionPackage));
  });
});

// A default package's schemas, hazards and has-checks flag ship in the build's
// types map (createDefaultTypesMap), so the first build checks it whether or
// not it is installed. Tests run against src, where the generated map is an
// empty stub, so the types map these builds take carries the entries the
// generator would write for a default package that is not installed.
describe('default packages', () => {
  const defaultPackage = '@lowdefy-test/default-plugin';
  const otherPackage = '@lowdefy-test/not-default';
  const pendingWarning = (name) => `Plugin checks for ${name} did not run: package not installed.`;

  const metas = {
    Title: {
      category: 'display',
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: { content: { type: 'string' }, level: { type: 'number' } },
      },
      hazards: [{ id: 'title-hazard', message: 'A Title hazard.', see: null }],
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

  // As createPluginTypesMap writes a package's types: its blockMetas come
  // from extractBlockTypes, which keeps no hazards.
  const typesMap = {
    ...testTypesMap,
    blocks: { ...testTypesMap.blocks, Title: { package: defaultPackage } },
    blockMetas: { ...testTypesMap.blockMetas, Title: { category: 'display' } },
    actions: { ...testTypesMap.actions, SetState: { package: defaultPackage } },
    operators: {
      client: { ...testTypesMap.operators.client, _if: { package: defaultPackage } },
      server: testTypesMap.operators.server,
    },
  };

  // The entries createDefaultTypesMap writes for the default package.
  const shippedTypesMap = {
    ...typesMap,
    schemas: {
      actions: { SetState: { package: defaultPackage, schema: schemas.SetState } },
      blocks: {
        Title: {
          package: defaultPackage,
          schema: buildBlockSchema(metas.Title),
          hazards: metas.Title.hazards,
        },
      },
      operators: { _if: { package: defaultPackage, schema: schemas._if } },
    },
    hasChecks: { [defaultPackage]: false },
  };

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

  const schemaMapFiles = [
    'actionSchemas.json',
    'blockMetas.json',
    'blockSchemas.json',
    'operatorMetas.json',
    'operatorSchemas.json',
  ];

  function writeConfig(config) {
    fs.writeFileSync(path.join(directories.config, 'lowdefy.yaml'), config);
  }

  function installPackage(name, files) {
    const pkgDir = path.join(directories.server, 'node_modules', name);
    fs.mkdirSync(pkgDir, { recursive: true });
    const exports = { './types': './types.js' };
    fs.writeFileSync(path.join(pkgDir, 'types.js'), 'export default {};\n');
    for (const [specifier, [file, content]] of Object.entries(files)) {
      exports[specifier] = `./${file}`;
      fs.writeFileSync(path.join(pkgDir, file), content);
    }
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ name, type: 'module', exports })
    );
  }

  function installDefaultPackage() {
    installPackage(defaultPackage, {
      './metas': ['metas.js', `export const Title = ${JSON.stringify(metas.Title)};\n`],
      './schemas': [
        'schemas.js',
        Object.entries(schemas)
          .map(([name, schema]) => `export const ${name} = ${JSON.stringify(schema)};\n`)
          .join(''),
      ],
    });
  }

  // Each plugin check finding as a developer reads it: level, location, slug and message.
  function pluginFindings({ lines }) {
    return lines
      .filter((line) => line.level >= 40 && line.err?.checkSlug === 'plugin-schema')
      .map((line) => ({
        level: line.level,
        name: line.err.name,
        source: path.relative(root, line.err.source).split(path.sep).join('/'),
        checkSlug: line.err.checkSlug,
        msg: line.msg,
      }));
  }

  function readSchemaMaps() {
    return Object.fromEntries(
      schemaMapFiles.map((file) => [
        file,
        JSON.parse(fs.readFileSync(path.join(directories.build, 'plugins', file), 'utf8')),
      ])
    );
  }

  // The passes `lowdefy build` makes: a build that an install follows, the
  // install, and a second build when the install gives something to check.
  async function lowdefyBuild({ customTypesMap, install = () => {}, skipPluginChecks }) {
    const { pluginChecksNeedRebuild } = await import('@lowdefy/node-utils');
    const first = runBuild({ customTypesMap, pluginInstallFollows: true, skipPluginChecks });
    install();
    const rebuild = pluginChecksNeedRebuild({
      buildDirectory: directories.build,
      serverDirectory: directories.server,
    });
    const second = rebuild ? runBuild({ customTypesMap, skipPluginChecks }) : null;
    return { first, second };
  }

  test('a used default package that is not installed is schema checked in one build, as the two-pass build checks it once installed', async () => {
    writeConfig(brokenConfig);

    const onePass = await lowdefyBuild({ customTypesMap: shippedTypesMap });
    expect(onePass.second).toBe(null);
    expect(onePass.first.status).toBe(0);
    expect(onePass.first.warnings).not.toContain(pendingWarning(defaultPackage));
    expect(fs.existsSync(pendingPath())).toBe(false);
    const onePassFindings = pluginFindings(onePass.first);
    const onePassMaps = readSchemaMaps();

    fs.rmSync(directories.build, { recursive: true, force: true });

    const twoPass = await lowdefyBuild({
      customTypesMap: typesMap,
      install: installDefaultPackage,
    });
    expect(twoPass.second).not.toBe(null);
    expect(twoPass.second.status).toBe(0);
    expect(pluginFindings(twoPass.first)).toEqual([]);

    expect(onePassFindings).toHaveLength(3);
    expect(onePassFindings.map(({ msg }) => msg)).toEqual([
      'Block "Title" property "levle" is not allowed.',
      'Action "SetState" required param "message" is missing.',
      'Operator "_if" required param "test" is missing.',
    ]);
    expect(onePassFindings).toEqual(pluginFindings(twoPass.second));
    expect(onePassMaps).toEqual(readSchemaMaps());
    expect(onePassMaps['blockMetas.json'].Title.hazards).toEqual(metas.Title.hazards);
  });

  test('a misspelt ~ignoreBuildChecks slug fails the first build when a used default package is not installed', () => {
    writeConfig(`lowdefy: local
pages:
  - id: home
    type: Box
    blocks:
      - id: title
        type: Title
        ~ignoreBuildChecks:
          - plugin-shcema
        properties:
          content: Hello
`);
    const { status, errors } = runBuild({
      customTypesMap: shippedTypesMap,
      pluginInstallFollows: true,
    });
    expect(status).toBe(1);
    expect(errors).toContain(
      '~ignoreBuildChecks slug "plugin-shcema" is not a built-in check or a rule of any plugin the app uses.'
    );
  });

  test('a custom plugin that registers a default block type name is checked against its own schema', () => {
    const customPackage = '@lowdefy-test/custom-title';
    installPackage(customPackage, {
      './metas': [
        'metas.js',
        `export const Title = ${JSON.stringify({
          category: 'display',
          properties: {
            type: 'object',
            additionalProperties: false,
            properties: { content: { type: 'string' }, levle: { type: 'number' } },
          },
        })};\n`,
      ],
    });
    writeConfig(`lowdefy: local
pages:
  - id: home
    type: Box
    blocks:
      - id: title
        type: Title
        properties:
          content: Hello
          levle: 2
          level: 2
`);
    const result = runBuild({
      customTypesMap: {
        ...shippedTypesMap,
        blocks: { ...shippedTypesMap.blocks, Title: { package: customPackage } },
      },
    });
    expect(result.status).toBe(0);
    expect(pluginFindings(result).map(({ msg }) => msg)).toEqual([
      'Block "Title" property "level" is not allowed.',
    ]);
  });

  test('a package that is neither default nor installed is still pending and warns', () => {
    writeConfig(`lowdefy: local
pages:
  - id: home
    type: Box
    blocks:
      - id: title
        type: Title
        properties:
          levle: 2
      - id: card
        type: TestCard
        properties:
          title: Hello
`);
    const { status, warnings, lines } = runBuild({
      customTypesMap: {
        ...shippedTypesMap,
        blocks: { ...shippedTypesMap.blocks, TestCard: { package: otherPackage } },
      },
    });
    expect(status).toBe(0);
    expect(warnings.filter((warning) => warning === pendingWarning(otherPackage))).toHaveLength(1);
    expect(warnings).not.toContain(pendingWarning(defaultPackage));
    expect(pluginFindings({ lines }).map(({ msg }) => msg)).toEqual([
      'Block "Title" property "levle" is not allowed.',
    ]);
    expect(JSON.parse(fs.readFileSync(pendingPath(), 'utf8'))).toEqual({
      packages: [{ name: otherPackage, schemaChecked: true }],
    });
  });

  test('with skipPluginChecks a default package that is not installed gives no schema findings and is not pending', async () => {
    writeConfig(brokenConfig);
    const { first, second } = await lowdefyBuild({
      customTypesMap: shippedTypesMap,
      skipPluginChecks: true,
    });
    expect(second).toBe(null);
    expect(first.status).toBe(0);
    expect(first.warnings).toContain('Plugin checks were skipped (--skip-plugin-checks).');
    expect(first.warnings).not.toContain(pendingWarning(defaultPackage));
    expect(pluginFindings(first)).toEqual([]);
    expect(fs.existsSync(pendingPath())).toBe(false);
  });
});
