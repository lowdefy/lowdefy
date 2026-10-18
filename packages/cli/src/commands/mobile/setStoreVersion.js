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
import { type } from '@lowdefy/helpers';
import { writeFileIfChanged } from '@lowdefy/node-utils';

import getNextStoreVersion from './getNextStoreVersion.js';

// Writes the store version of this native build to shell.json, which the
// shell's app config reads as `version`. Build numbers are EAS's (remote
// version source), so only the version is worked out here.
async function setStoreVersion({ context, dryRun, latestBuilds, shellProject }) {
  const { projectDirectory, shell, shellJson } = shellProject;
  if (!type.isString(shell.version)) {
    throw new Error(
      `Shell "${shell.id}" has no "version". A store build needs one as "major.minor", like "1.4"; each build raises the patch.`
    );
  }
  if (dryRun) {
    context.logger.info(
      `[dry run] shell.json version: ${shell.version}.<patch>, one past the latest build's on ${shell.version}, else ${shell.version}.0.`
    );
    return null;
  }
  const version = getNextStoreVersion({
    entryVersion: shell.version,
    latestVersions: latestBuilds.map((build) => build?.appVersion ?? null),
  });
  await writeFileIfChanged(
    path.join(projectDirectory, 'shell.json'),
    `${JSON.stringify({ ...shellJson, version }, null, 2)}\n`
  );
  context.logger.info(`Store version ${version}.`);
  return version;
}

export default setStoreVersion;
