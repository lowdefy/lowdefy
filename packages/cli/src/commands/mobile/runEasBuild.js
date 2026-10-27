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

function getBuildArgs({ autoSubmit, local, nonInteractive, platform, profile, wait }) {
  const args = ['build', '--platform', platform, '--profile', profile];
  if (nonInteractive) {
    args.push('--non-interactive');
  }
  if (!wait) {
    args.push('--no-wait');
  }
  if (autoSubmit) {
    args.push('--auto-submit');
  }
  if (local) {
    args.push('--local');
  }
  return args;
}

// eas build with the profile named after the environment (or `development`).
// Interactive unless asked otherwise, so the first build of a shell can sign
// in to Apple and Google and have EAS create its credentials.
async function runEasBuild({
  autoSubmit = false,
  context,
  dryRun,
  local = false,
  nonInteractive = false,
  platform,
  profile,
  projectDirectory,
  wait = true,
}) {
  await runEas({
    context,
    args: getBuildArgs({ autoSubmit, local, nonInteractive, platform, profile, wait }),
    projectDirectory,
    dryRun,
  });
}

export default runEasBuild;
