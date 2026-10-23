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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, test } from 'vitest';
import YAML from 'yaml';

import yamlPlugin from './index.js';
import sample from './tests/sample.yaml';

const packagesDir = fileURLToPath(new URL('../../../', import.meta.url));

// The YAML files the tests import: the fixtures of @lowdefy/client and @lowdefy/layout.
function findYaml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['node_modules', 'dist', '.turbo'].includes(entry.name) ? [] : findYaml(full);
    }
    return entry.name.endsWith('.yaml') ? [full] : [];
  });
}

const fixtures = [
  ...findYaml(path.join(packagesDir, 'client', 'src')),
  ...findYaml(path.join(packagesDir, 'layout', 'src')),
  fileURLToPath(new URL('./tests/sample.yaml', import.meta.url)),
];

// The module body @lowdefy/jest-yaml-transform gave a YAML file, after `module.exports = `.
function jestTransformBody(source) {
  return JSON.stringify(YAML.parse(source), null, '\t');
}

async function runEsModule(code) {
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return (await import(/* @vite-ignore */ url)).default;
}

test('finds the client and layout YAML fixtures', () => {
  const layout = fixtures.filter((file) => file.includes(`${path.sep}layout${path.sep}`));
  expect(layout.length).toBeGreaterThanOrEqual(6);
});

describe.each(fixtures.map((file) => [path.relative(packagesDir, file), file]))('%s', (_, file) => {
  const source = fs.readFileSync(file, 'utf8');
  const pluginCode = yamlPlugin().transform(source, file).code;

  test('gives the module body the jest transform gave', () => {
    expect(pluginCode).toBe(`export default ${jestTransformBody(source)};`);
  });

  test('evaluates to the parsed YAML', async () => {
    expect(await runEsModule(pluginCode)).toEqual(YAML.parse(source));
  });
});

test('a .yaml import through Vite gives the parsed file', () => {
  expect(sample).toEqual({
    id: 'page',
    type: 'Box',
    properties: { title: 'Hello', count: 3, enabled: true, empty: null },
    blocks: [
      { id: 'a', type: 'Button' },
      { id: 'b', type: 'Anchor' },
    ],
  });
});

test('leaves other files and ?raw or ?url imports alone', () => {
  const plugin = yamlPlugin();
  expect(plugin.transform('a: 1', '/app/page.js')).toBe(null);
  expect(plugin.transform('a: 1', '/app/page.yml')).toBe(null);
  expect(plugin.transform('a: 1', '/app/page.yaml?raw')).toBe(null);
  expect(plugin.transform('a: 1', '/app/page.yaml?url')).toBe(null);
  expect(plugin.transform('a: 1', '/app/page.yaml').code).toBe('export default {\n\t"a": 1\n};');
});

test('include picks the files to transform', () => {
  const plugin = yamlPlugin({ include: /\.ya?ml$/ });
  expect(plugin.transform('a: 1', '/app/page.yml').code).toBe('export default {\n\t"a": 1\n};');
});
