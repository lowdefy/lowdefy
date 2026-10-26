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

const QUOTED_MESSAGE = /^"(.*)" \(/s;

// eas update:list shows a message as `"<message>" (<when> by <who>)`.
function getMessage(updateGroup) {
  return updateGroup.message.match(QUOTED_MESSAGE)?.[1] ?? updateGroup.message;
}

// update --rollback: republishes the update before the latest one for this
// runtime version, so the binaries it reaches go back to it.
async function rollbackUpdate({ context, dryRun, shellProject, platform }) {
  const { environment, projectDirectory, runtimeVersion } = shellProject;
  const updateGroups = await listUpdateGroups({
    context,
    dryRun,
    environment,
    limit: 2,
    platform,
    projectDirectory,
    runtimeVersion,
  });
  const previous = updateGroups[1];
  if (!dryRun && previous === undefined) {
    throw new Error(
      `No earlier update on ${environment} for runtime version ${runtimeVersion} to roll back to.`
    );
  }
  await runEas({
    context,
    args: [
      'update:republish',
      '--group',
      previous?.group ?? '<group of the update before the latest>',
      '--platform',
      platform,
      '--message',
      previous ? `${getMessage(previous)} rollback` : '<its message> rollback',
      '--non-interactive',
    ],
    projectDirectory,
    dryRun,
  });
}

export default rollbackUpdate;
