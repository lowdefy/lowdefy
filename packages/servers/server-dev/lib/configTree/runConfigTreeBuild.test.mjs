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

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';

import runConfigTreeBuild from './runConfigTreeBuild.mjs';

jest.setTimeout(120000);

const serverDevDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

function writeApp({ directory, title }) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, 'lowdefy.yaml'),
    [
      'lowdefy: 6.0.0',
      'pages:',
      '  - id: home',
      '    type: Box',
      '    blocks:',
      '      - id: title',
      '        type: Html',
      '        properties:',
      `          html: ${title}`,
      '',
    ].join('\n')
  );
}

// A stand-in for the app's .lowdefy/dev: the real server-dev package.json,
// public_default and node_modules, plus a public/ and a tailwind/ the running
// dev server would hold.
function writeDevDirectory({ directory }) {
  fs.mkdirSync(path.join(directory, 'public'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'lowdefy-build', 'tailwind'), { recursive: true });
  fs.copyFileSync(
    path.join(serverDevDirectory, 'package.json'),
    path.join(directory, 'package.json')
  );
  fs.cpSync(
    path.join(serverDevDirectory, 'public_default'),
    path.join(directory, 'public_default'),
    {
      recursive: true,
    }
  );
  fs.writeFileSync(path.join(directory, 'public', 'logo.svg'), '<svg>live</svg>');
  fs.writeFileSync(
    path.join(directory, 'lowdefy-build', 'tailwind', 'pages.css'),
    '@source "live";'
  );
  fs.symlinkSync(
    path.join(serverDevDirectory, 'node_modules'),
    path.join(directory, 'node_modules')
  );
}

function hashTree(directory) {
  const hash = crypto.createHash('sha1');
  function walk(current) {
    fs.readdirSync(current, { withFileTypes: true })
      .filter((entry) => entry.name !== 'node_modules')
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((entry) => {
        const full = path.join(current, entry.name);
        hash.update(path.relative(directory, full));
        if (entry.isDirectory()) {
          walk(full);
        } else {
          hash.update(fs.readFileSync(full));
        }
      });
  }
  walk(directory);
  return hash.digest('hex');
}

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-config-tree-build-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('runConfigTreeBuild builds base and head into scratch directories and writes nothing under the dev directory', async () => {
  const devDirectory = path.join(root, 'app', '.lowdefy', 'dev');
  writeApp({ directory: path.join(root, 'app'), title: 'Head' });
  writeApp({ directory: path.join(root, 'base-tree', 'app'), title: 'Base' });
  writeDevDirectory({ directory: devDirectory });
  const before = hashTree(devDirectory);

  const [base, head] = await Promise.all([
    runConfigTreeBuild({
      configDirectory: path.join(root, 'base-tree', 'app'),
      outDirectory: path.join(root, 'builds', 'base'),
      devDirectory,
      logger,
    }),
    runConfigTreeBuild({
      configDirectory: path.join(root, 'app'),
      outDirectory: path.join(root, 'builds', 'head'),
      devDirectory,
      logger,
    }),
  ]);

  expect(base).toEqual({ status: 'ok', errors: [], warnings: [] });
  expect(head).toEqual({ status: 'ok', errors: [], warnings: [] });
  expect(hashTree(devDirectory)).toEqual(before);
  expect(fs.readFileSync(path.join(devDirectory, 'public', 'logo.svg'), 'utf8')).toEqual(
    '<svg>live</svg>'
  );
  const headPage = fs.readFileSync(
    path.join(root, 'builds', 'head', 'build', 'pages', 'home.json'),
    'utf8'
  );
  const basePage = fs.readFileSync(
    path.join(root, 'builds', 'base', 'build', 'pages', 'home.json'),
    'utf8'
  );
  expect(headPage).toContain('Head');
  expect(basePage).toContain('Base');
  expect(
    JSON.parse(fs.readFileSync(path.join(root, 'builds', 'head', 'result.json'), 'utf8')).status
  ).toEqual('ok');
  expect(
    fs.lstatSync(path.join(root, 'builds', 'head', 'server', 'node_modules')).isSymbolicLink()
  ).toBe(true);
  const configText = JSON.parse(
    fs.readFileSync(path.join(root, 'builds', 'head', 'configText.json'), 'utf8')
  );
  expect(configText).toEqual(expect.arrayContaining(['Head', 'OK', 'Cancel']));
  expect(configText).not.toContain('Base');
});

test('runConfigTreeBuild reports a plugin the dev directory does not install as a build error', async () => {
  const devDirectory = path.join(root, 'app', '.lowdefy', 'dev');
  writeApp({ directory: path.join(root, 'app'), title: 'Head' });
  fs.appendFileSync(
    path.join(root, 'app', 'lowdefy.yaml'),
    'plugins:\n  - name: "@acme/blocks-not-installed"\n    version: 1.2.0\n'
  );
  writeDevDirectory({ directory: devDirectory });

  const result = await runConfigTreeBuild({
    configDirectory: path.join(root, 'app'),
    outDirectory: path.join(root, 'builds', 'head'),
    devDirectory,
    logger,
  });

  expect(result.status).toEqual('error');
  expect(result.errors[0].message).toContain('@acme/blocks-not-installed');
});

test('runConfigTreeBuild reports the config errors of a tree that does not build', async () => {
  const devDirectory = path.join(root, 'app', '.lowdefy', 'dev');
  writeApp({ directory: path.join(root, 'app'), title: 'Head' });
  fs.writeFileSync(
    path.join(root, 'app', 'lowdefy.yaml'),
    'lowdefy: 6.0.0\npages:\n  - id: home\n    type: Buton\n'
  );
  writeDevDirectory({ directory: devDirectory });

  const result = await runConfigTreeBuild({
    configDirectory: path.join(root, 'app'),
    outDirectory: path.join(root, 'builds', 'head'),
    devDirectory,
    logger,
  });

  expect(result.status).toEqual('error');
  expect(result.errors.map((error) => error.message).join('\n')).toContain('Buton');
  expect(fs.existsSync(path.join(root, 'builds', 'head', 'configText.json'))).toBe(false);
});
