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

import listUpdateGroups from './listUpdateGroups.js';
import runEas from './runEas.js';

// update --promote: the latest update for this runtime version, rolled out to
// every device (eas update:edit --rollout-percentage 100).
async function promoteUpdate({ context, dryRun, shellProject, platform }) {
  const { environment, projectDirectory, runtimeVersion } = shellProject;
  const [latest] = await listUpdateGroups({
    context,
    dryRun,
    environment,
    limit: 1,
    platform,
    projectDirectory,
    runtimeVersion,
  });
  if (!dryRun && latest === undefined) {
    throw new Error(
      `No update on ${environment} for runtime version ${runtimeVersion} to promote. Send one with lowdefy mobile update --rollout <percent>.`
    );
  }
  await runEas({
    context,
    args: [
      'update:edit',
      latest?.group ?? '<group of the latest update>',
      '--rollout-percentage',
      '100',
      '--non-interactive',
    ],
    projectDirectory,
    dryRun,
  });
}

export default promoteUpdate;
