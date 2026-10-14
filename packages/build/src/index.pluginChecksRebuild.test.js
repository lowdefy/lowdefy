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

function runBuild({ skipPluginChecks } = {}) {
  const options = {
    customTypesMap: {
      ...testTypesMap,
      operators: {
        client: { ...testTypesMap.operators.client, _if: { package: packageName } },
        server: testTypesMap.operators.server,
      },
    },
    directories,
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
  };
}

test('a build before the install lists the plugin as pending; the build after it runs its rules', () => {
  const first = runBuild();
  expect(first.status).toBe(0);
  expect(first.warnings).toContain(
    `Plugin checks for ${packageName} did not run: package not installed.`
  );
  expect(JSON.parse(fs.readFileSync(pendingPath(), 'utf8'))).toEqual({
    packages: [packageName],
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
