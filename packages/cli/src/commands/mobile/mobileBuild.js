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

import fs from 'fs';
import path from 'path';
import { cleanDirectory, copyFileOrDirectory } from '@lowdefy/node-utils';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import build from '../build/build.js';
import generateCapacitorConfig from './generateCapacitorConfig.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import readMobileBuildConfig from './readMobileBuildConfig.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runCapacitorCommand from './runCapacitorCommand.js';
import runClientBuild from '../../utils/runClientBuild.js';

async function mobileBuild({ context }) {
  context.logger.info('Starting mobile build.');

  // Full lowdefy build (server + artifacts); skippable when the backend is
  // already built (--no-server-build).
  if (context.options.serverBuild !== false) {
    await build({ context });
  }

  // The bundle bakes serverUrl as its API origin — an empty value ships an
  // app that can never reach a server, so fail the build instead.
  const mobileConfig = await readMobileBuildConfig({ context });
  if (!process.env.LOWDEFY_MOBILE_SERVER_URL && !mobileConfig.serverUrl) {
    throw new Error(
      '"mobile.serverUrl" is required to build the mobile app. Set it in lowdefy.yaml or override with LOWDEFY_MOBILE_SERVER_URL.'
    );
  }

  const directory = context.directories.mobile;
  await getServer({ context, packageName: '@lowdefy/mobile-client', directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await installServer({ context, directory });
  await runClientBuild({
    context,
    directory,
    env: { LOWDEFY_DIRECTORY_BUILD: context.directories.build },
    name: 'mobile client',
  });

  // The static Vite output becomes Capacitor's webDir.
  const wwwDirectory = path.join(context.directories.mobileProject, 'www');
  await cleanDirectory(wwwDirectory);
  await copyFileOrDirectory(path.join(directory, 'dist'), wwwDirectory);
  context.logger.info('Copied mobile bundle to mobile project www.');

  await generateCapacitorConfig({ context, mobileConfig });

  const hasIos = fs.existsSync(path.join(context.directories.mobileProject, 'ios'));
  const hasAndroid = fs.existsSync(path.join(context.directories.mobileProject, 'android'));
  if (hasIos || hasAndroid) {
    await runCapacitorCommand({ context, exec: ['cap', 'sync'], message: 'Running cap sync.' });
  } else {
    context.logger.warn(
      'No native platforms found in the mobile project. Run "lowdefy mobile init" to add them.'
    );
  }

  // Icon and splash generation via the @capacitor/assets convention
  // (mobile/assets/logo.png, splash.png).
  if (fs.existsSync(path.join(context.directories.mobileProject, 'assets'))) {
    await runCapacitorCommand({
      context,
      exec: ['capacitor-assets', 'generate'],
      message: 'Generating icons and splash screens.',
    });
  }

  await context.sendTelemetry({ sendTypes: true });
  context.logger.info({ spin: 'succeed' }, 'Mobile build successful.');
}

export default mobileBuild;
