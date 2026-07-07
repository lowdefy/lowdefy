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

import { findAvailablePort } from '@lowdefy/node-utils';
import { wait } from '@lowdefy/helpers';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import generateCapacitorConfig from './generateCapacitorConfig.js';
import getLanAddress from './getLanAddress.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import runCapacitorCommand from './runCapacitorCommand.js';
import runMobileDevServer from './runMobileDevServer.js';

async function mobileDev({ context }) {
  context.logger.info('Starting mobile development server.');

  const port = await findAvailablePort({ port: context.options.port });
  if (port !== context.options.port) {
    context.logger.warn(`Port ${context.options.port} is in use, using port ${port} instead.`);
    context.options.port = port;
  }
  const mobilePort = await findAvailablePort({ port: Number(context.options.mobilePort ?? 3001) });
  context.options.mobilePort = mobilePort;

  // Standard dev server (JIT builds, watchers, SSE reload) — unchanged.
  await getServer({ context, packageName: '@lowdefy/server-dev', directory: context.directories.dev });
  await addCustomPluginsAsDeps({ context, directory: context.directories.dev });
  await installServer({ context, directory: context.directories.dev });

  // Mobile client lane — the dev manager spawns its Vite process (env flag).
  await getServer({
    context,
    packageName: '@lowdefy/mobile-client',
    directory: context.directories.mobile,
  });
  await addCustomPluginsAsDeps({ context, directory: context.directories.mobile });
  await installServer({ context, directory: context.directories.mobile });

  context.sendTelemetry();
  context.logger.info(`Mobile client will run at http://localhost:${mobilePort}`);

  const devServerPromise = runMobileDevServer({ context, directory: context.directories.dev });

  // On-device live reload: point the native app at the LAN mobile Vite server
  // and deploy with cap run.
  const platform = context.options.ios ? 'ios' : context.options.android ? 'android' : null;
  if (platform) {
    const lanAddress = getLanAddress();
    if (!lanAddress) {
      throw new Error('Could not determine a LAN address for on-device live reload.');
    }
    await generateCapacitorConfig({
      context,
      devServerUrl: `http://${lanAddress}:${mobilePort}`,
    });
    await runCapacitorCommand({ context, args: ['sync', platform], message: 'Running cap sync.' });
    // Give the dev servers a moment to bind before the device app connects.
    await wait(3000);
    await runCapacitorCommand({
      context,
      args: ['run', platform],
      message: `Running app on ${platform}.`,
    });
  }

  await devServerPromise;
}

export default mobileDev;
