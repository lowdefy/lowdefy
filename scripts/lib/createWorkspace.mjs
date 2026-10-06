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

import { findPnpmWorkspaceRoot } from './addPlugins.mjs';
import { REPO_ROOT } from './parseArgs.mjs';

// The repo root installs no YAML parser; the CLI, which writes the same file
// for the servers it generates, does.
const YAML = createRequire(path.join(REPO_ROOT, 'packages/cli/package.json'))('yaml');

// The server's own dependencies with build scripts: true runs the script,
// false skips it. mongodb-memory-server (through @shelf/jest-mongodb, a
// server-dev dev dependency) only downloads a MongoDB binary in its
// postinstall, which mongodb-memory-server-core downloads when it first
// starts one.
const serverAllowBuilds = {
  '@sentry/cli': true,
  '@swc/core': true,
  'better-sqlite3': true,
  esbuild: true,
  'mongodb-memory-server': false,
  sharp: true,
};

// The build approvals of the pnpm workspace the app lives in (its own
// repository, for an app outside this one), so the plugins it installs from
// npm build as they do there. pnpm 11 fails an install on any dependency build
// script that is neither allowed nor ignored.
function readAppAllowBuilds({ configDirectory }) {
  const workspaceRoot = findPnpmWorkspaceRoot(configDirectory);
  if (workspaceRoot === null) {
    return {};
  }
  const filePath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
  const document = YAML.parseDocument(fs.readFileSync(filePath, 'utf8'));
  if (document.errors.length > 0) {
    throw new Error(`Could not parse ${filePath}: ${document.errors[0].message}`);
  }
  const settings = document.toJS() ?? {};
  return {
    ...Object.fromEntries((settings.onlyBuiltDependencies ?? []).map((name) => [name, true])),
    ...Object.fromEntries((settings.ignoredBuiltDependencies ?? []).map((name) => [name, false])),
    ...settings.allowBuilds,
  };
}

function namesWith({ allowBuilds, allowed }) {
  return Object.keys(allowBuilds)
    .filter((name) => allowBuilds[name] === allowed)
    .sort();
}

function createWorkspace({ targetDir, configDirectory }) {
  // A dependency the app's workspace allows or ignores keeps the app's choice.
  const allowBuilds = {
    ...serverAllowBuilds,
    ...readAppAllowBuilds({ configDirectory }),
  };
  // pnpm 11 stopped reading pnpm.overrides from package.json, so the link:
  // overrides written by rewriteDeps/addPlugins (this runs after both) are
  // mirrored into pnpm-workspace.yaml. Without them a fresh install resolves
  // @lowdefy/* plugins from the npm registry instead of the monorepo.
  const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
  const overrides = pkg.pnpm?.overrides ?? {};
  // packages: [] keeps the copy out of any workspace above it. pnpm 10 reads
  // onlyBuiltDependencies and ignoredBuiltDependencies; pnpm >=10.29 and 11
  // read allowBuilds.
  const workspace = {
    packages: [],
    onlyBuiltDependencies: namesWith({ allowBuilds, allowed: true }),
    ignoredBuiltDependencies: namesWith({ allowBuilds, allowed: false }),
    allowBuilds,
  };
  if (Object.keys(overrides).length > 0) {
    workspace.overrides = overrides;
  }
  fs.writeFileSync(path.join(targetDir, 'pnpm-workspace.yaml'), YAML.stringify(workspace));
  if (!fs.existsSync(path.join(targetDir, '.npmrc'))) {
    fs.writeFileSync(path.join(targetDir, '.npmrc'), 'strict-peer-dependencies=false\n');
  }
}

export default createWorkspace;
