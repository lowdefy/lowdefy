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

import { spawnProcess } from '@lowdefy/node-utils';

// Reads one published package.json from the registry with `pnpm view
// <name>@<version> --json`, run in the app's config directory so the
// registries and auth in the app's .npmrc apply. Returns null when the package
// has no such version. Every registry read lowdefy mobile makes goes through
// here, so tests stub this one module.
async function viewNpmPackage({ context, name, version }) {
  const stdout = [];
  const stderr = [];
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: ['view', `${name}@${version}`, '--json'],
      stdOutLineHandler: (line) => stdout.push(line),
      stdErrLineHandler: (line) => stderr.push(`${line}`),
      processOptions: {
        cwd: context.configDirectory,
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
        shell: process.platform === 'win32',
      },
    });
  } catch (error) {
    throw new Error(
      `Could not read "${name}@${version}" from the registry. ${stderr.join('\n')}`.trim(),
      { cause: error }
    );
  }
  const text = stdout.join('\n').trim();
  if (text === '') {
    return null;
  }
  const packageJson = JSON.parse(text);
  // A spec that matches several versions prints a list; an exact version prints one.
  return Array.isArray(packageJson) ? packageJson.at(-1) : packageJson;
}

export default viewNpmPackage;
