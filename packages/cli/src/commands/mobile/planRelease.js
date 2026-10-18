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

import getLatestBuild from './getLatestBuild.js';
import listUpdateGroups from './listUpdateGroups.js';
import parseShellVersion from './parseShellVersion.js';

// What release does for one store: build and submit when no binary on the
// channel has this runtime version, an update when the binaries do but the
// latest update is another shell version (or there is none), else nothing.
async function planRelease({ context, platform, shellProject }) {
  const { environment, projectDirectory, runtimeVersion, shellVersion } = shellProject;
  const latestBuild = await getLatestBuild({
    context,
    dryRun: false,
    environment,
    platform,
    projectDirectory,
  });
  if (latestBuild === null) {
    return {
      action: 'build',
      latestBuild,
      platform,
      reason: `no build on the ${environment} channel yet`,
    };
  }
  if (latestBuild.runtimeVersion !== runtimeVersion) {
    return {
      action: 'build',
      latestBuild,
      platform,
      reason: `the latest build has runtime version ${latestBuild.runtimeVersion}, the shell now ${runtimeVersion}`,
    };
  }
  const [latestUpdate] = await listUpdateGroups({
    context,
    dryRun: false,
    environment,
    limit: 1,
    platform,
    projectDirectory,
  });
  const updatedShellVersion = parseShellVersion(latestUpdate?.message);
  if (updatedShellVersion === null) {
    return {
      action: 'update',
      platform,
      reason: `no update on ${environment} names its shell version`,
    };
  }
  if (updatedShellVersion !== shellVersion) {
    return {
      action: 'update',
      platform,
      reason: `the latest update carries shell ${updatedShellVersion}, the shell is now ${shellVersion}`,
    };
  }
  return {
    action: 'nothing',
    platform,
    reason: `runtime version ${runtimeVersion} and shell ${shellVersion} are already out`,
  };
}

export default planRelease;
