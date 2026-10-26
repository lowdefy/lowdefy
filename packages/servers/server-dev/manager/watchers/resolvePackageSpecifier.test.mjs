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
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, expect, test } from 'vitest';

import resolvePackageSpecifier from './resolvePackageSpecifier.mjs';

let dir;

function write(relative, content) {
  const filePath = path.join(dir, relative);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function resolve({ packageJson, specifier }) {
  write('package.json', JSON.stringify({ name: '@app/plugin', ...packageJson }));
  return resolvePackageSpecifier({ dir, packageName: '@app/plugin', specifier });
}

beforeEach(() => {
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-resolve-specifier-test-')));
  write('dist/connections.js', '');
  write('dist/esm/connections.js', '');
  write('dist/cjs/connections.cjs', '');
  write('src/connections.js', '');
  write('src/lib/query.js', '');
  write('index.js', '');
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

test('resolvePackageSpecifier resolves a subpath through a string export', () => {
  expect(
    resolve({
      packageJson: { exports: { './connections': './dist/connections.js' } },
      specifier: '@app/plugin/connections',
    })
  ).toEqual({ filePath: path.join(dir, 'dist/connections.js') });
});

test('resolvePackageSpecifier takes the import condition over require', () => {
  expect(
    resolve({
      packageJson: {
        exports: {
          './connections': {
            require: './dist/cjs/connections.cjs',
            import: './dist/esm/connections.js',
          },
        },
      },
      specifier: '@app/plugin/connections',
    })
  ).toEqual({ filePath: path.join(dir, 'dist/esm/connections.js') });
});

test('resolvePackageSpecifier takes the development condition in key order', () => {
  expect(
    resolve({
      packageJson: {
        exports: {
          './connections': {
            development: './src/connections.js',
            default: './dist/connections.js',
          },
        },
      },
      specifier: '@app/plugin/connections',
    })
  ).toEqual({ filePath: path.join(dir, 'src/connections.js') });
});

test('resolvePackageSpecifier matches the subpath pattern with the longest prefix', () => {
  expect(
    resolve({
      packageJson: { exports: { './*': './nothing/*.js', './conn*': './dist/conn*.js' } },
      specifier: '@app/plugin/connections',
    })
  ).toEqual({ filePath: path.join(dir, 'dist/connections.js') });
});

test('resolvePackageSpecifier resolves the package root through a conditions object', () => {
  expect(
    resolve({ packageJson: { exports: { import: './index.js' } }, specifier: '@app/plugin' })
  ).toEqual({ filePath: path.join(dir, 'index.js') });
});

test('resolvePackageSpecifier resolves a package without exports from its files', () => {
  expect(resolve({ packageJson: {}, specifier: '@app/plugin' })).toEqual({
    filePath: path.join(dir, 'index.js'),
  });
  expect(resolve({ packageJson: {}, specifier: '@app/plugin/src/connections' })).toEqual({
    filePath: path.join(dir, 'src/connections.js'),
  });
});

test('resolvePackageSpecifier resolves a subpath import through the imports field', () => {
  expect(
    resolve({ packageJson: { imports: { '#lib/*': './src/lib/*' } }, specifier: '#lib/query.js' })
  ).toEqual({ filePath: path.join(dir, 'src/lib/query.js') });
});

test('resolvePackageSpecifier returns the package a subpath import names', () => {
  expect(
    resolve({ packageJson: { imports: { '#lodash': 'lodash' } }, specifier: '#lodash' })
  ).toEqual({ specifier: 'lodash' });
});

test('resolvePackageSpecifier returns null when the package does not map the specifier', () => {
  expect(
    resolve({
      packageJson: { exports: { './blocks': './dist/blocks.js' } },
      specifier: '@app/plugin/connections',
    })
  ).toBe(null);
  expect(
    resolve({
      packageJson: { exports: { './connections': { require: './dist/cjs/connections.cjs' } } },
      specifier: '@app/plugin/connections',
    })
  ).toBe(null);
  expect(resolve({ packageJson: { imports: { '#a': '#b' } }, specifier: '#a' })).toBe(null);
});

test('resolvePackageSpecifier returns null when the exported file is missing', () => {
  expect(
    resolve({
      packageJson: { exports: { './connections': './dist/missing.js' } },
      specifier: '@app/plugin/connections',
    })
  ).toBe(null);
});
