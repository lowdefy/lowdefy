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
import { createRequire } from 'node:module';
import path from 'node:path';

import { REPO_ROOT } from '../parseArgs.mjs';

const YAML = createRequire(path.join(REPO_ROOT, 'packages/cli/package.json'))('yaml');

function relinkFrom({ from, spec, to }) {
  if (typeof spec !== 'string' || !spec.startsWith('link:')) {
    return spec;
  }
  const target = path.resolve(from, spec.slice('link:'.length));
  return `link:${path.relative(to, target)}`;
}

// The CLI treats the nearest pnpm-workspace.yaml above the server directory as
// the app's workspace. Without this file that is the Lowdefy checkout itself:
// the CLI would install the server's linked @lowdefy/* packages there
// (installWorkspacePlugins) and, for an app with a pinned Lowdefy version,
// rewrite the server's pnpm-workspace.yaml from the checkout's settings,
// dropping the link: overrides. This file holds the server's own settings,
// written relative to its directory, so the CLI's rewrite gives the server back
// the same settings, and lists every linked package so a "workspace:" plugin
// resolves to the package addPlugins linked.
function writeParentWorkspace({ serverDirectory }) {
  const parentDirectory = path.dirname(serverDirectory);
  const serverWorkspace = YAML.parse(
    fs.readFileSync(path.join(serverDirectory, 'pnpm-workspace.yaml'), 'utf8')
  );
  const overrides = Object.fromEntries(
    Object.entries(serverWorkspace.overrides ?? {}).map(([name, spec]) => [
      name,
      relinkFrom({ from: serverDirectory, spec, to: parentDirectory }),
    ])
  );
  const packages = Object.values(overrides)
    .filter((spec) => spec.startsWith('link:'))
    .map((spec) => spec.slice('link:'.length).split(path.sep).join('/'))
    .sort();
  const workspace = { ...serverWorkspace, packages, overrides };
  fs.writeFileSync(path.join(parentDirectory, 'pnpm-workspace.yaml'), YAML.stringify(workspace));
}

export default writeParentWorkspace;
