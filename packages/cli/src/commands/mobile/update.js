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

import config from './config.js';
import createUpdateMessage from './createUpdateMessage.js';
import parseRollout from './parseRollout.js';
import promoteUpdate from './promoteUpdate.js';
import rollbackUpdate from './rollbackUpdate.js';
import runEasUpdate from './runEasUpdate.js';

function checkOptions({ promote, rollback, rollout }) {
  const picked = [
    ['--promote', promote],
    ['--rollback', rollback],
    ['--rollout', rollout !== undefined],
  ].filter(([, value]) => value === true);
  if (picked.length > 1) {
    throw new Error(
      `${picked.map(([flag]) => flag).join(' and ')} cannot be used together. Pick one.`
    );
  }
}

// lowdefy mobile update: sends the shell's JavaScript over the air to the
// environment's channel. --rollout sends it to a share of devices, --promote
// takes the latest update to all of them and --rollback republishes the one
// before it.
async function mobileUpdate({ context }) {
  const { platform = 'all', promote = false, rollback = false, rollout } = context.options;
  const dryRun = context.options.dryRun === true;
  checkOptions({ promote, rollback, rollout });
  const rolloutPercent = rollout === undefined ? undefined : parseRollout(rollout);
  const shellProject = await config({ context });
  if (promote) {
    await promoteUpdate({ context, dryRun, platform, shellProject });
    return;
  }
  if (rollback) {
    await rollbackUpdate({ context, dryRun, platform, shellProject });
    return;
  }
  const { environment, projectDirectory, runtimeVersion, shellJson, shellVersion } = shellProject;
  await runEasUpdate({
    context,
    dryRun,
    environment,
    message: createUpdateMessage({ profile: shellJson.profile, runtimeVersion, shellVersion }),
    platform,
    projectDirectory,
    rollout: rolloutPercent,
  });
}

export default mobileUpdate;
