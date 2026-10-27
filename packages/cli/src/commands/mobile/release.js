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
import getLatestBuild from './getLatestBuild.js';
import getPlatforms from './getPlatforms.js';
import listUpdateGroups from './listUpdateGroups.js';
import parseRollout from './parseRollout.js';
import planRelease from './planRelease.js';
import runEasBuild from './runEasBuild.js';
import runEasSubmit from './runEasSubmit.js';
import runEasUpdate from './runEasUpdate.js';
import setStoreVersion from './setStoreVersion.js';

const ACTION_TEXT = {
  build: 'build and submit',
  update: 'update',
  nothing: 'nothing to do',
};

// Release always runs EAS without prompts: it is what CI runs, after a person
// has made the shell's first build and submission. With --auto-submit EAS
// submits each build when it finishes, so --no-wait can end the job early;
// without it release waits for the build to submit it.
function getBuildFlags({ autoSubmit, wait }) {
  if (!wait && !autoSubmit) {
    throw new Error(
      'lowdefy mobile release --no-wait needs --auto-submit: without it release waits for each build to submit it.'
    );
  }
  return { autoSubmit, nonInteractive: true, wait };
}

async function buildAndSubmit({ buildFlags, context, dryRun, platform, shellProject }) {
  const { environment, projectDirectory } = shellProject;
  await runEasBuild({
    ...buildFlags,
    context,
    dryRun,
    platform,
    profile: environment,
    projectDirectory,
  });
  if (!buildFlags.autoSubmit) {
    await runEasSubmit({
      context,
      dryRun,
      environment,
      nonInteractive: true,
      platform,
      projectDirectory,
    });
  }
}

async function sendUpdate({ context, dryRun, platform, rollout, shellProject }) {
  const { environment, projectDirectory, runtimeVersion, shellJson, shellVersion } = shellProject;
  await runEasUpdate({
    context,
    dryRun,
    environment,
    message: createUpdateMessage({ profile: shellJson.profile, runtimeVersion, shellVersion }),
    platform,
    projectDirectory,
    rollout,
  });
}

// --dry-run decides nothing: it prints the reads, then each path with the
// condition that picks it, for every store.
async function printReleasePaths({ buildFlags, context, platforms, rollout, shellProject }) {
  const { environment, projectDirectory, runtimeVersion, shellVersion } = shellProject;
  for (const platform of platforms) {
    context.logger.info(
      `[dry run] ${platform}: read the latest build and update on ${environment}.`
    );
    await getLatestBuild({ context, dryRun: true, environment, platform, projectDirectory });
    await listUpdateGroups({
      context,
      dryRun: true,
      environment,
      limit: 1,
      platform,
      projectDirectory,
    });
    context.logger.info(
      `[dry run] ${platform}, when there is no build or its runtime version is not ${runtimeVersion}: build and submit.`
    );
    await setStoreVersion({ context, dryRun: true, latestBuilds: [], shellProject });
    await buildAndSubmit({ buildFlags, context, dryRun: true, platform, shellProject });
    context.logger.info(
      `[dry run] ${platform}, when the build is on ${runtimeVersion} and the latest update is not shell ${shellVersion}: update.`
    );
    await sendUpdate({ context, dryRun: true, platform, rollout, shellProject });
    context.logger.info(`[dry run] ${platform}, otherwise: nothing to do.`);
  }
}

// lowdefy mobile release: what CI runs. Per store it builds and submits when
// the shell's native code changed (a new runtime version), sends an update
// when only its JavaScript did (a new shell version), or does nothing.
async function mobileRelease({ context }) {
  const { autoSubmit = false, platform = 'all', rollout, wait = true } = context.options;
  const dryRun = context.options.dryRun === true;
  const buildFlags = getBuildFlags({ autoSubmit, wait });
  const rolloutPercent = rollout === undefined ? undefined : parseRollout(rollout);
  const platforms = getPlatforms(platform);
  const shellProject = await config({ context });
  if (dryRun) {
    await printReleasePaths({
      buildFlags,
      context,
      platforms,
      rollout: rolloutPercent,
      shellProject,
    });
    return;
  }
  const plans = [];
  for (const storePlatform of platforms) {
    plans.push(await planRelease({ context, platform: storePlatform, shellProject }));
  }
  plans.forEach(({ action, platform: storePlatform, reason }) => {
    context.logger.info(`${storePlatform}: ${ACTION_TEXT[action]}, as ${reason}.`);
  });
  const builds = plans.filter(({ action }) => action === 'build');
  if (builds.length > 0) {
    // One store version for every store built in this release.
    await setStoreVersion({
      context,
      dryRun,
      latestBuilds: builds.map(({ latestBuild }) => latestBuild),
      shellProject,
    });
  }
  for (const { platform: storePlatform } of builds) {
    await buildAndSubmit({ buildFlags, context, dryRun, platform: storePlatform, shellProject });
  }
  for (const { platform: storePlatform } of plans.filter(({ action }) => action === 'update')) {
    await sendUpdate({
      context,
      dryRun,
      platform: storePlatform,
      rollout: rolloutPercent,
      shellProject,
    });
  }
}

export default mobileRelease;
