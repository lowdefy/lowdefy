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

import { vi, afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { create } from 'tar';

const tarballs = {};
const integrities = {};
let root;
let directory;

function sri(data) {
  return `sha512-${crypto.createHash('sha512').update(data).digest('base64')}`;
}

const packageDocument = {
  versions: {
    '1.0.0': {
      dist: { tarball: 'https://registry.example/tarball-valid', integrity: 'valid' },
    },
    tampered: {
      dist: { tarball: 'https://registry.example/tarball-traversal', integrity: 'valid' },
    },
    traversal: {
      dist: { tarball: 'https://registry.example/tarball-traversal', integrity: 'traversal' },
    },
    noIntegrity: {
      dist: { tarball: 'https://registry.example/tarball-valid' },
    },
    v404: { dist: { tarball: 'https://registry.example/404' } },
    v500: { dist: { tarball: 'https://registry.example/500' } },
    network: { dist: { tarball: 'https://registry.example/network-error' } },
  },
};

function networkError() {
  return new TypeError('fetch failed', {
    cause: new Error('getaddrinfo ENOTFOUND registry.example'),
  });
}

// Integrities name a tarball until the tarballs are packed, then resolve to its hash.
function withIntegrities(document) {
  const versions = {};
  Object.entries(document.versions).forEach(([version, { dist }]) => {
    versions[version] = {
      dist: {
        ...dist,
        integrity: dist.integrity && integrities[dist.integrity],
      },
    };
  });
  return { versions };
}

const mockFetch = vi.fn(async (url) => {
  if (url === 'https://registry.npmjs.org/valid-package') {
    return Response.json(withIntegrities(packageDocument));
  }
  if (url === 'https://registry.example/tarball-valid') {
    return new Response(tarballs.valid);
  }
  if (url === 'https://registry.example/tarball-traversal') {
    return new Response(tarballs.traversal);
  }
  if (url === 'https://registry.npmjs.org/404' || url === 'https://registry.example/404') {
    return new Response('Not found', { status: 404 });
  }
  if (url === 'https://registry.npmjs.org/500' || url === 'https://registry.example/500') {
    return new Response('Server error', { status: 500 });
  }
  throw networkError();
});
vi.stubGlobal('fetch', mockFetch);

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
  ['does not match the registry integrity', 'tampered', 'does not match the sha512 integrity hash'],
  ['has no registry integrity', 'noIntegrity', 'has no sha512, sha384 or sha256 integrity hash'],
])('a tarball that %s is not extracted', async (_, version, message) => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version, directory })
  ).rejects.toThrow(`Package "valid-package@${version}" tarball ${message}`);
  expect(fs.existsSync(directory)).toBe(false);
});

test('a tarball with an entry outside the directory fails and leaves nothing behind', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'traversal', directory })
  ).rejects.toThrow();
  // The valid package.json entry comes before the bad one, but a partial
  // server would stop getServer from fetching again.
  expect(fs.readdirSync(path.dirname(directory))).toEqual([]);
});

test('a failed extraction over an earlier download can be retried', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  fs.mkdirSync(path.join(directory, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'lib', 'old.js'), 'old');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'traversal', directory })
  ).rejects.toThrow();
  expect(fs.existsSync(path.join(directory, 'package.json'))).toBe(false);

  await fetchNpmTarball({ packageName: 'valid-package', version: '1.0.0', directory });
  expect(fs.readdirSync(directory).sort()).toEqual(['lib', 'package.json']);
  // A server entry replaces its namesake whole.
  expect(fs.readdirSync(path.join(directory, 'lib'))).toEqual(['index.js']);
});

test('files in the directory that are not part of the server are kept', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  // A Vercel deploy directory: the build step runs vercel.build.sh from here
  // after the install step fetched the server into it.
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'vercel.build.sh'), 'echo build');
  fs.writeFileSync(path.join(directory, 'vercel.json'), '{}');
  await fetchNpmTarball({ packageName: 'valid-package', version: '1.0.0', directory });
  expect(fs.readdirSync(directory).sort()).toEqual([
    'lib',
    'package.json',
    'vercel.build.sh',
    'vercel.json',
  ]);
  expect(fs.readFileSync(path.join(directory, 'vercel.build.sh'), 'utf8')).toBe('echo build');
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

test('npm responds with an error status', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: '500', version: '1.0.0', directory })
  ).rejects.toThrow('Request failed with status code 500');
});

test('npm cannot be reached', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'network-error', version: '1.0.0', directory })
  ).rejects.toThrow('getaddrinfo ENOTFOUND registry.example');
});

test('the package document times out after 30 seconds and the tarball download never does', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  await fetchNpmTarball({ packageName: 'valid-package', version: '1.0.0', directory });
  expect(timeout.mock.calls).toEqual([[30000]]);
  timeout.mockRestore();
});

test('tarball 404', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'v404', directory })
  ).rejects.toThrow(
    'Package "valid-package" tarball could not be found at https://registry.example/404.'
  );
  expect(fs.existsSync(directory)).toBe(false);
});

test('tarball error status', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'v500', directory })
  ).rejects.toThrow('Request failed with status code 500');
  expect(fs.existsSync(directory)).toBe(false);
});

test('tarball cannot be reached', async () => {
  const { default: fetchNpmTarball } = await import('./fetchNpmTarball.js');
  await expect(
    fetchNpmTarball({ packageName: 'valid-package', version: 'network', directory })
  ).rejects.toThrow('getaddrinfo ENOTFOUND registry.example');
});
