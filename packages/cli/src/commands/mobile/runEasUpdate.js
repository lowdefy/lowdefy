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

import runEas from './runEas.js';

// Publishes the shell's JavaScript to the environment's channel. Only
// @lowdefy/shell code travels: the app's pages come from its server.
async function runEasUpdate({
  context,
  dryRun,
  environment,
  message,
  platform,
  projectDirectory,
  rollout,
}) {
  const args = [
    'update',
    '--channel',
    environment,
    '--platform',
    platform,
    '--message',
    message,
    '--non-interactive',
  ];
  if (rollout !== undefined) {
    args.push('--rollout-percentage', String(rollout));
  }
  await runEas({ context, args, projectDirectory, dryRun });
}

export default runEasUpdate;
