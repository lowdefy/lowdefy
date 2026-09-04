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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';
import { moduleLockfileName, readModuleLockfile, writeModuleLockfile } from '@lowdefy/node-utils';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import ensurePnpmWorkspaceYaml from '../../utils/ensurePnpmWorkspaceYaml.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runLowdefyBuild from '../../utils/runLowdefyBuild.js';

function shortCommit(commit) {
  if (!type.isString(commit)) return 'none';
  return commit.slice(0, 7);
}

function formatChange({ id, before, after }) {
  if (type.isNone(after)) {
    return `${id}  ${before.ref}  removed`;
  }
  if (type.isNone(before)) {
    return `${id}  ${after.ref}  added ${shortCommit(after.commit)}`;
  }
  if (before.commit === after.commit && before.ref === after.ref) {
    return `${id}  ${after.ref}  unchanged`;
  }
  return `${id}  ${after.ref}  ${shortCommit(before.commit)} → ${shortCommit(after.commit)}`;
}

async function modulesUpdate({ context, params }) {
  const configDirectory = context.directories.config;
  const name = params?.[0];
  const before = await readModuleLockfile({ configDirectory });

  const invalidated = {};
  if (type.isString(name)) {
    if (type.isNone(before[name])) {
      const known = Object.keys(before).sort();
      throw new ConfigError(
        `Module "${name}" has no entry in ${moduleLockfileName}. ${
          known.length === 0
            ? 'The lockfile has no entries.'
            : `Known entries: ${known.join(', ')}.`
        }`
      );
    }
    context.logger.info(`Invalidating lock entry for module "${name}".`);
    for (const id of Object.keys(before)) {
      if (id !== name) invalidated[id] = before[id];
    }
  } else {
    context.logger.info('Invalidating all module lock entries.');
  }

  await writeModuleLockfile({ configDirectory, lockfile: invalidated });

  // Only the build writes lock entries, so rebuild to re-resolve what was
  // deleted. The client bundle is unaffected by module refs, so it is skipped.
  const directory = context.directories.server;
  await getServer({ context, packageName: '@lowdefy/server', directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await ensurePnpmWorkspaceYaml({ context, directory });
  await installServer({ context, directory });
  // Opt the build in to rewriting the lockfile it would otherwise leave alone
  // under the production stage.
  await runLowdefyBuild({
    context,
    directory,
    env: { LOWDEFY_BUILD_WRITE_MODULE_LOCK: '1' },
  });

  const after = await readModuleLockfile({ configDirectory });

  const ids = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  for (const id of ids) {
    context.logger.info(formatChange({ id, before: before[id], after: after[id] }));
  }

  await context.sendTelemetry();
  context.logger.info({ spin: 'succeed' }, `Modules updated. Commit ${moduleLockfileName}.`);
}

export default modulesUpdate;
