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

import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Unpack } from 'tar';

import httpFetch from './httpFetch.js';
import verifyIntegrity from './verifyIntegrity.js';

// A package document runs to a megabyte or two (every version's metadata): a command that needs
// it waits longer than the default before giving up on a slow network.
const REGISTRY_TIMEOUT_MS = 30000;

async function fetchNpmTarball({ packageName, version, directory }) {
  const registryUrl = `https://registry.npmjs.org/${packageName}`;
  const packageResponse = await httpFetch({ url: registryUrl, timeoutMs: REGISTRY_TIMEOUT_MS });
  if (packageResponse.status === 404) {
    throw new Error(`Package "${packageName}" could not be found at ${registryUrl}.`);
  }
  if (!packageResponse.ok) {
    throw new Error(`Request failed with status code ${packageResponse.status}`);
  }
  const packageInfo = await packageResponse.json();

  if (!packageInfo.versions[version]) {
    throw new Error(`Invalid version. "${packageName}" does not have version "${version}".`);
  }
  const { dist } = packageInfo.versions[version];

  // No timeout: one would cut a download off mid-file on a slow network. The whole tarball is
  // read before anything is extracted, so its integrity is checked first.
  const tarballResponse = await httpFetch({ url: dist.tarball, timeoutMs: 0 });
  if (tarballResponse.status === 404) {
    throw new Error(`Package "${packageName}" tarball could not be found at ${dist.tarball}.`);
  }
  if (!tarballResponse.ok) {
    throw new Error(`Request failed with status code ${tarballResponse.status}`);
  }
  const tarball = Buffer.from(await tarballResponse.arrayBuffer());

  verifyIntegrity({
    data: tarball,
    integrity: dist.integrity,
    name: `Package "${packageName}@${version}" tarball`,
  });
  // The tarball extracts next to the target and moves into place only once
  // every entry is written. getServer takes a directory with a package.json
  // for a complete server, so a failed extraction must leave nothing behind.
  // The server's entries replace their namesakes in the directory one by one,
  // package.json last, and everything else in the directory stays: a
  // --server-directory can hold the deployment's own files (a Vercel deploy
  // directory keeps its build scripts there).
  await fs.promises.mkdir(path.dirname(directory), { recursive: true });
  const staging = await fs.promises.mkdtemp(`${directory}-download-`);
  try {
    // strict turns tar's warnings into errors, so an entry that would land
    // outside the directory (a "../" path, an absolute path or a link out)
    // fails the extraction instead of being skipped.
    await pipeline(
      Readable.from([tarball]),
      new Unpack({
        cwd: staging,
        strict: true,
        strip: 1, // Removes the leading package/ directory from each path
      })
    );
    await fs.promises.mkdir(directory, { recursive: true });
    // A package.json left from an earlier server goes first, so an
    // interrupted move never looks like a complete server.
    await fs.promises.rm(path.join(directory, 'package.json'), { force: true });
    const entries = (await fs.promises.readdir(staging)).sort(
      (a, b) => (a === 'package.json') - (b === 'package.json')
    );
    for (const entry of entries) {
      const target = path.join(directory, entry);
      await fs.promises.rm(target, { recursive: true, force: true });
      await fs.promises.rename(path.join(staging, entry), target);
    }
  } finally {
    await fs.promises.rm(staging, { recursive: true, force: true });
  }
}

export default fetchNpmTarball;
