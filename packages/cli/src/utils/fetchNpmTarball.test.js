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

import { jest } from '@jest/globals';
import { create } from 'tar';

const tarballs = {};
const integrities = {};
let root;
let directory;

function sri(data) {
  return `sha512-${crypto.createHash('sha512').update(data).digest('base64')}`;
}

jest.unstable_mockModule('axios', () => {
  return {
    default: {
      get(url) {
        if (url === 'https://registry.npmjs.org/valid-package') {
          return Promise.resolve({
            data: {
              versions: {
                '1.0.0': {
                  dist: { tarball: 'tarball-valid', integrity: integrities.valid },
                },
                tampered: {
                  dist: { tarball: 'tarball-traversal', integrity: integrities.valid },
                },
                traversal: {
                  dist: { tarball: 'tarball-traversal', integrity: integrities.traversal },
                },
                noIntegrity: {
                  dist: { tarball: 'tarball-valid' },
                },
                v404: {
                  dist: {
                    tarball: 'https://registry.npmjs.org/404',
                  },
                },
                noData: {
                  dist: {
                    tarball: 'https://registry.npmjs.org/no-data',
                  },
                },
                undef: {
                  dist: {
                    tarball: 'https://registry.npmjs.org/undefined',
                  },
                },
                error: {
                  dist: {
                    tarball: 'https://registry.npmjs.org/axios-error',
                  },
                },
              },
            },
          });
        }
        if (url === 'tarball-valid') {
          return { data: tarballs.valid };
        }
        if (url === 'tarball-traversal') {
          return { data: tarballs.traversal };
        }
        if (url === 'https://registry.npmjs.org/404') {
          const error = new Error('Test 404');
          error.response = {};
          error.response.status = 404;
          throw error;
        }
        if (url === 'https://registry.npmjs.org/axios-error') {
          throw new Error('Axios error');
        }
        if (url === 'https://registry.npmjs.org/no-data') {
          return {};
        }
        if (url === 'https://registry.npmjs.org/undefined') {
          return;
        }
        return;
      },
    },
  };
});

// npm tarballs keep every file under a top-level package/ directory.
async function packTarball({ cwd, entries, name, preservePaths = false }) {
  const file = path.join(root, `${name}.tgz`);
  await create({ cwd, file, gzip: true, preservePaths }, entries);
  tarballs[name] = fs.readFileSync(file);
  integrities[name] = sri(tarballs[name]);
}

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-cli-tarball-'));
  const source = path.join(root, 'source');
  fs.mkdirSync(path.join(source, 'package', 'lib'), { recursive: true });
  fs.writeFileSync(path.join(source, 'package', 'package.json'), '{"name":"valid-package"}');
  fs.writeFileSync(path.join(source, 'package', 'lib', 'index.js'), 'export default 1;');
  fs.writeFileSync(path.join(root, 'escaped.txt'), 'outside');
  await packTarball({ cwd: source, entries: ['package'], name: 'valid' });
  // After the package/ prefix is stripped, the second entry is ../escaped.txt.
  await packTarball({
    cwd: source,
    entries: ['package/package.json', 'package/../../escaped.txt'],
    name: 'traversal',
    preservePaths: true,
  });
});

beforeEach(() => {
  directory = path.join(fs.mkdtempSync(path.join(root, 'install-')), 'server');
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('valid package and version extracts the tarball without its package directory', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await fetchNpmTarball({ packageName: 'valid-package', version: '1.0.0', directory });
  expect(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')).toBe(
    '{"name":"valid-package"}'
  );
  expect(fs.readFileSync(path.join(directory, 'lib', 'index.js'), 'utf8')).toBe(
    'export default 1;'
  );
});

test.each([
  ['does not match the registry integrity', 'tampered', 'does not match the integrity hash'],
  ['has no registry integrity', 'noIntegrity', 'has no integrity hash'],
])('a tarball that %s is not extracted', async (_, version, message) => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version, directory })
  ).rejects.toThrow(`Package "valid-package@${version}" tarball ${message}`);
  expect(fs.existsSync(directory)).toBe(false);
});

test('a tarball with an entry outside the directory fails without writing it', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'traversal', directory })
  ).rejects.toThrow();
  expect(fs.existsSync(path.join(directory, '..', 'escaped.txt'))).toBe(false);
});

test('version does not exist', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'invalid', directory })
  ).rejects.toThrow('Invalid version. "valid-package" does not have version "invalid"');
});

test('npm return a 404', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: '404', version: '1.0.0', directory })
  ).rejects.toThrow('Package "404" could not be found at https://registry.npmjs.org/404.');
});

test('axios error', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'axios-error', version: '1.0.0', directory })
  ).rejects.toThrow('Axios error');
});

test('empty response', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'no-data', version: '1.0.0', directory })
  ).rejects.toThrow('Package "no-data" could not be found at https://registry.npmjs.org/no-data.');
});

test('undefined response', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'undefined', version: '1.0.0', directory })
  ).rejects.toThrow(
    'Package "undefined" could not be found at https://registry.npmjs.org/undefined.'
  );
});

test('tarball 404', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'v404', directory })
  ).rejects.toThrow(
    'Package "valid-package" tarball could not be found at https://registry.npmjs.org/404.'
  );
});

test('tarball axios error', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'error', directory })
  ).rejects.toThrow('Axios error');
});

test('tarball empty response', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'noData', directory })
  ).rejects.toThrow(
    'Package "valid-package" tarball could not be found at https://registry.npmjs.org/no-data.'
  );
});

test('tarball undefined response', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');

  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'undef', directory })
  ).rejects.toThrow(
    'Package "valid-package" tarball could not be found at https://registry.npmjs.org/undefined.'
  );
});
