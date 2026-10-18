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

import checkNoRunningInstance from './checkNoRunningInstance.js';
import connectDevices from './connectDevices.js';
import installDevServer from '../../utils/installDevServer.js';
import prepareDevices from './prepareDevices.js';
import resolveDevPort from './resolveDevPort.js';
import runDevServer from './runDevServer.js';

async function dev({ context }) {
  context.logger.info('Starting development server.');
  checkNoRunningInstance({ context });
  const devices = await prepareDevices({ context });
  await resolveDevPort({ context });
  await installDevServer({ context });
  context.sendTelemetry();
  const server = runDevServer({ context, directory: context.directories.dev });
  connectDevices({ context, devices, server });
  await server;
}

export default dev;
