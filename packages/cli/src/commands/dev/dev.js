/*
  Copyright 2020-2021 Lowdefy, Inc

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

import opener from 'opener';

import buildWatcher from './buildWatcher.js';
import envWatcher from './envWatcher.js';
import getLocalServer from './getLocalServer.js';
// import getServer from './getServer.js';
import installServer from './installServer.js';
import prepare from './prepare.js';
import runLowdefyBuild from './runLowdefyBuild.js';
import runNextDev from './runNextDev.js';
import triggerDevReload from './triggerDevReload.js';
import versionWatcher from './versionWatcher.js';

const handleLowdefyDevBuild = async ({ context }) => {
  await runLowdefyBuild({ context });
  await installServer({ context });
  await triggerDevReload({ context });
};

async function dev({ context }) {
  await prepare({ context });
  await getServer({ context });
  // await getLocalServer({ context }); // TODO: Used for local builds, remove once finished;
  await installServer({ context });
  await handleLowdefyDevBuild({ context });

  buildWatcher({ build: handleLowdefyDevBuild, context });
  envWatcher({ context });
  versionWatcher({ context });

  context.print.log('Starting Lowdefy development server.');

  await runNextDev({ context }); // TODO: Fix process block
  opener(`http://localhost:${context.options.port}`);

  // await context.sendTelemetry({
  //   data: {
  //     type: 'startup',
  //   },
  // });
}

export default dev;
