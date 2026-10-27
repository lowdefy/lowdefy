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

// The newest update groups on the environment's branch (EAS names it after the
// channel), newest first, each { group, message, runtimeVersion, platforms }.
// A dry run prints the command and returns none.
async function listUpdateGroups({
  context,
  dryRun,
  environment,
  limit,
  platform,
  projectDirectory,
  runtimeVersion,
}) {
  const args = [
    'update:list',
    '--branch',
    environment,
    '--platform',
    platform,
    '--limit',
    String(limit),
  ];
  if (runtimeVersion) {
    args.push('--runtime-version', runtimeVersion);
  }
  args.push('--json', '--non-interactive');
  const result = await runEas({ context, args, projectDirectory, dryRun });
  return result?.currentPage ?? [];
}

export default listUpdateGroups;
