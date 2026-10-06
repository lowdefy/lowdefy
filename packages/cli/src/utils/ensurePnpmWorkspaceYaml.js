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
import { type } from '@lowdefy/helpers';
import {
  findPnpmWorkspaceRoot,
  readFile,
  writeFile,
  writeFileIfChanged,
} from '@lowdefy/node-utils';

import createNestedNpmrc from './createNestedNpmrc.js';
import createNestedWorkspaceYaml from './createNestedWorkspaceYaml.js';
import linkWorkspacePlugins from './linkWorkspacePlugins.js';
import readParentWorkspace from './readParentWorkspace.js';

// pnpm no longer reads the "pnpm" field in package.json, and pnpm 11 fails
// installs with ERR_PNPM_IGNORED_BUILDS unless dependency build scripts are
// allowed in pnpm-workspace.yaml. The key differs by version:
// - packages is required by pnpm 9 and 10.0, and stops pnpm from treating the
//   server as part of a parent workspace.
// - onlyBuiltDependencies and ignoredBuiltDependencies are read by early
//   pnpm 10 versions.
// - allowBuilds is read by pnpm >=10.29 and pnpm 11.
// @sentry/cli (through @sentry/vite-plugin) gets its binary from a platform
// optional dependency; its postinstall only downloads the binary when that
// dependency is missing, so it is skipped. mongodb-memory-server (through
// @shelf/jest-mongodb, a dev dependency of @lowdefy/server-dev) only downloads
// a MongoDB binary in its postinstall; mongodb-memory-server-core downloads it
// when it first starts one, so it is skipped too. Ignoring them, not leaving
// them out, keeps pnpm 11 from failing and pnpm 10 from warning.
const pnpmWorkspaceYaml = `packages:
  - '.'
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
ignoredBuiltDependencies:
  - '@sentry/cli'
  - mongodb-memory-server
allowBuilds:
  better-sqlite3: true
  sharp: true
  '@sentry/cli': false
  mongodb-memory-server: false
`;

async function writeNestedNpmrc({ context, directory, parentWorkspace, workspaceRoot }) {
  const filePath = path.join(directory, '.npmrc');
  const serverNpmrc = await readFile(filePath);
  const { npmrc: parentNpmrc, npmrcPath: parentNpmrcPath } = parentWorkspace;
  if (type.isNone(parentNpmrc) && type.isNone(serverNpmrc)) {
    return;
  }
  const { content, skippedKeys } = createNestedNpmrc({
    directory,
    parentNpmrc,
    parentNpmrcPath,
    serverNpmrc,
    workspaceRoot,
  });
  skippedKeys.forEach((key) => {
    context.logger.warn(
      `"${key}" in ${parentNpmrcPath} holds a credential, so it is not copied to the server's .npmrc. Reference an environment variable instead (${key}=\${NPM_TOKEN}), or move the line to your user ~/.npmrc.`
    );
  });
  await writeFileIfChanged(filePath, content);
}

async function ensurePnpmWorkspaceYaml({ context, directory }) {
  // Local mode runs against the monorepo packages; writing a nested
  // pnpm-workspace.yaml there would corrupt the monorepo workspace.
  if (context.lowdefyVersion === 'local') {
    return;
  }
  const filePath = path.join(directory, 'pnpm-workspace.yaml');
  const workspaceRoot = findPnpmWorkspaceRoot(path.dirname(directory));
  if (workspaceRoot === null) {
    // Keep existing files so users can allow builds for their own plugin deps.
    if (fs.existsSync(filePath)) {
      return;
    }
    await writeFile(filePath, pnpmWorkspaceYaml);
    return;
  }
  // Inside a pnpm workspace the server still installs as its own workspace:
  // the server directory is gitignored, so as a member of the parent it would
  // make the parent's committed lockfile depend on uncommitted state. The file
  // and .npmrc are derived from the parent's and rewritten on every run
  // (keeping only the release-age exclusions pnpm itself adds), so build
  // allowlists for plugin dependencies belong in the parent's
  // pnpm-workspace.yaml.
  context.logger.debug(
    `Found pnpm workspace at ${workspaceRoot}; the server installs as its own workspace with its settings.`
  );
  const parentWorkspace = await readParentWorkspace({
    pnpmCmd: context.pnpmCmd,
    workspaceRoot,
  });
  await writeFileIfChanged(
    filePath,
    createNestedWorkspaceYaml({
      directory,
      parentWorkspace,
      serverWorkspaceYaml: await readFile(filePath),
      workspaceRoot,
    })
  );
  await writeNestedNpmrc({ context, directory, parentWorkspace, workspaceRoot });
  await linkWorkspacePlugins({ directory, parentWorkspace, workspaceRoot });
}

export default ensurePnpmWorkspaceYaml;
