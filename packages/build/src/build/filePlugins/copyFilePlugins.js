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
import path from 'node:path';

import { LowdefyInternalError } from '@lowdefy/errors';
import { copyFileOrDirectory } from '@lowdefy/node-utils';

import collectRelativeImportClosure from './collectRelativeImportClosure.js';

/**
 * Copies every discovered file plugin, and the closure of its relative imports,
 * to <server>/<config-root relative path> for production builds.
 *
 * The prod server directory must run with the config directory absent, so the
 * generated barrels import the copy (filePluginTargetPath) rather than the file
 * in place. The copy lands under the server's Vite root, which is what lets a
 * .jsx block reach the client bundle transformed. In dev nothing is copied: the
 * barrels import the file the author edits so Vite hot-replaces it.
 */
async function copyFilePlugins({ context }) {
  if (context.stage !== 'prod') return;
  if (context.directories.config === context.directories.server) return;

  const roots = [...new Set((context.filePlugins ?? []).map((record) => record.file))];
  const files = collectRelativeImportClosure({
    configDirectory: context.directories.config,
    roots,
  });
  for (const absolutePath of files) {
    const relativePath = path.relative(context.directories.config, absolutePath);
    const destination = path.resolve(context.directories.server, relativePath);
    try {
      await copyFileOrDirectory(absolutePath, destination);
    } catch (err) {
      // Discovery read the file, so a failure here is a broken invariant, not a
      // config fault.
      throw new LowdefyInternalError(
        `Failed to copy file plugin "${relativePath}" to the server directory.`,
        { cause: err }
      );
    }
  }
}

export default copyFilePlugins;
