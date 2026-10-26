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
import getLatestBuild from './getLatestBuild.js';
import getPlatforms from './getPlatforms.js';
import runEasBuild from './runEasBuild.js';
import setStoreVersion from './setStoreVersion.js';

const DEVELOPMENT = 'development';

// lowdefy mobile build: writes the shell project, raises the store version
// from the latest build on the environment's channel, then runs eas build.
// --profile development builds a development client instead, which takes no
// store version.
async function mobileBuild({ context }) {
  const { local = false, nonInteractive = false, platform = 'all', profile } = context.options;
  const dryRun = context.options.dryRun === true;
  const shellProject = await config({ context });
  const { environment, projectDirectory } = shellProject;
  if (profile !== DEVELOPMENT) {
    const latestBuilds = [];
    for (const storePlatform of getPlatforms(platform)) {
      latestBuilds.push(
        await getLatestBuild({
          context,
          dryRun,
          environment,
          platform: storePlatform,
          projectDirectory,
        })
      );
    }
    await setStoreVersion({ context, dryRun, latestBuilds, shellProject });
  }
  await runEasBuild({
    context,
    dryRun,
    local,
    nonInteractive,
    platform,
    profile: profile ?? environment,
    projectDirectory,
    // In CI the build is queued and the job ends; EAS finishes it.
    wait: !nonInteractive || local,
  });
}

export default mobileBuild;
