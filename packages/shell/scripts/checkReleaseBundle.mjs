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

/*
  The release-bundle check: a customer shell must not carry Lowdefy Dev's developer features (the
  dev-tab client, which agents drive the app through, the connect flow and the shake menu).

  Exports the shell's JavaScript bundle with LOWDEFY_SHELL_VARIANT=release for each platform and
  fails when any file of it holds the dev-tab client's marker string (src/dev/tab/devClientMarker.js).
  With --control it first exports the dev variant and fails when the marker is missing there, which
  shows the check can see it. A shell's release build runs it before a store build.

    node scripts/checkReleaseBundle.mjs [--platform ios|android] [--control]
*/

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shellRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { DEV_CLIENT_MARKER } = require('../shellVariant.js');

function readArgs(argv) {
  const platformIndex = argv.indexOf('--platform');
  return {
    control: argv.includes('--control'),
    platforms: platformIndex === -1 ? ['ios', 'android'] : [argv[platformIndex + 1]],
  };
}

function exportBundle({ outputDir, platform, variant }) {
  execFileSync(
    path.join(shellRoot, 'node_modules', '.bin', 'expo'),
    ['export', '--platform', platform, '--output-dir', outputDir, '--clear'],
    {
      cwd: shellRoot,
      env: { ...process.env, LOWDEFY_SHELL_VARIANT: variant },
      stdio: ['ignore', 'ignore', 'inherit'],
    }
  );
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

// Hermes bytecode keeps string literals as plain bytes, so the marker is found in .hbc files too.
function findMarker(outputDir) {
  const marker = Buffer.from(DEV_CLIENT_MARKER);
  return listFiles(outputDir).filter((file) => fs.readFileSync(file).includes(marker));
}

function checkVariant({ platform, variant }) {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), `lowdefy-shell-${variant}-${platform}-`));
  try {
    exportBundle({ outputDir, platform, variant });
    const found = findMarker(outputDir).map((file) => path.relative(outputDir, file));
    return { found, files: listFiles(outputDir).length };
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

function main() {
  const { control, platforms } = readArgs(process.argv.slice(2));
  let failed = false;
  platforms.forEach((platform) => {
    if (control) {
      const dev = checkVariant({ platform, variant: 'dev' });
      if (dev.found.length === 0) {
        console.error(`${platform}: the dev bundle does not hold "${DEV_CLIENT_MARKER}".`);
        failed = true;
        return;
      }
      console.log(
        `${platform}: the dev bundle holds the dev-tab client (${dev.found.join(', ')}).`
      );
    }
    const release = checkVariant({ platform, variant: 'release' });
    if (release.found.length > 0) {
      console.error(
        `${platform}: the release bundle holds the dev-tab client (${release.found.join(', ')}).`
      );
      failed = true;
      return;
    }
    console.log(
      `${platform}: the release bundle (${release.files} files) holds no dev-tab client.`
    );
  });
  if (failed) {
    process.exit(1);
  }
}

main();
