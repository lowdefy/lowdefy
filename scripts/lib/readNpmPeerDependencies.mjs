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

import { execFileSync } from 'node:child_process';

// The required (non-optional) peer dependencies an npm package declares, read
// from the registry before it is installed. Runs in the app's directory, so
// the registries in the app's .npmrc apply.
function readNpmPeerDependencies({ cwd, name, version }) {
  // The whole manifest: with several fields asked for, pnpm 10 (through npm) and
  // pnpm 11 shape the output differently.
  const output = execFileSync('pnpm', ['view', `${name}@${version}`, '--json'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  // A range matching several versions lists each; the last is the newest.
  const manifest = [JSON.parse(output)].flat().at(-1);
  const peerDependencies = manifest.peerDependencies ?? {};
  const peerDependenciesMeta = manifest.peerDependenciesMeta ?? {};
  return Object.fromEntries(
    Object.entries(peerDependencies).filter(([peer]) => !peerDependenciesMeta[peer]?.optional)
  );
}

export default readNpmPeerDependencies;
