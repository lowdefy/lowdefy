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

import build from '../build/build.js';
import generateCapacitorConfig from './generateCapacitorConfig.js';
import getServer from '../../utils/getServer.js';
import installMobileProject from './installMobileProject.js';
import readMobileBuildConfig from './readMobileBuildConfig.js';
import runCapacitorCommand from './runCapacitorCommand.js';
import scaffoldMobileProject from './scaffoldMobileProject.js';

async function mobileInit({ context }) {
  context.logger.info('Initializing mobile project.');

  // The Capacitor config is generated from build/mobile/config.json — run a
  // full build first when the app has not been built yet.
  if (!fs.existsSync(path.join(context.directories.build, 'mobile', 'config.json'))) {
    context.logger.info('No build artifacts found — running "lowdefy build" first.');
    await build({ context });
  }

  await getServer({
    context,
    packageName: '@lowdefy/mobile-client',
    directory: context.directories.mobile,
  });

  const mobileConfig = await readMobileBuildConfig({ context });
  if (!mobileConfig.appId) {
    throw new Error('"mobile.appId" is required in lowdefy.yaml to initialize a mobile project.');
  }
  await scaffoldMobileProject({ context, appId: mobileConfig.appId });
  await installMobileProject({ context });
  await generateCapacitorConfig({ context });

  const projectDirectory = context.directories.mobileProject;
  if (context.options.ios !== false && !fs.existsSync(path.join(projectDirectory, 'ios'))) {
    await runCapacitorCommand({ context, args: ['add', 'ios'], message: 'Adding iOS platform.' });
  }
  if (context.options.android !== false && !fs.existsSync(path.join(projectDirectory, 'android'))) {
    await runCapacitorCommand({
      context,
      args: ['add', 'android'],
      message: 'Adding Android platform.',
    });
  }

  await context.sendTelemetry();
  context.logger.info(
    { spin: 'succeed' },
    `Mobile project initialized for ${mobileConfig.appId}. Run "lowdefy mobile build" to build the app.`
  );
}

export default mobileInit;
