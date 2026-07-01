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

import path from 'path';
import { cleanDirectory, copyFileOrDirectory, readFile, writeFile } from '@lowdefy/node-utils';

import apiHandler from './apiHandler.js';

// One serverless function handles every dynamic path; config.json routes send all non-static
// requests to it (equivalent to the old vercel.json catch-all rewrite).
const vcConfig = {
  runtime: 'nodejs22.x',
  handler: 'api/index.js',
  launcherType: 'Nodejs',
  maxDuration: 60,
};

// The crons array is generated from build/schedules.json (written by @lowdefy/build for endpoints
// that declare `schedules`). A missing file means no schedules → no crons.
async function readCrons({ buildDirectory }) {
  const raw = await readFile(path.join(buildDirectory, 'schedules.json'));
  if (!raw) return [];
  const schedules = JSON.parse(raw);
  return schedules.map(({ endpointId, cron }) => ({
    path: `/api/cron/${endpointId}`,
    schedule: cron,
  }));
}

// Assembles a Vercel Build Output (.vercel/output) from an already-built server directory, so the
// deployment config — including cron jobs derived from endpoint `schedules` — is generated at build
// time and never committed. Run after `lowdefy build` (server + config artifacts) and the client
// build (dist/client).
async function vercelOutput({ context }) {
  const { directories, logger } = context;
  logger.info('Assembling Vercel Build Output.');

  const serverDirectory = directories.server;
  const buildDirectory = directories.build;
  const clientDirectory = path.join(serverDirectory, 'dist', 'client');
  const outputDirectory = path.join(serverDirectory, '.vercel', 'output');
  const staticDirectory = path.join(outputDirectory, 'static');
  const functionDirectory = path.join(outputDirectory, 'functions', 'api.func');

  // Start clean so artifacts from a previous build do not leak into the deployment.
  await cleanDirectory(outputDirectory);

  // 1. Static assets + public files served by the Vercel CDN.
  await copyFileOrDirectory(clientDirectory, staticDirectory);

  // 2. The single serverless function — the Hono app plus everything it reads at runtime. The
  //    Build Output API has no includeFiles glob: the .func directory must physically contain these.
  await copyFileOrDirectory(path.join(serverDirectory, 'src'), path.join(functionDirectory, 'src'));
  await copyFileOrDirectory(path.join(serverDirectory, 'lib'), path.join(functionDirectory, 'lib'));
  await copyFileOrDirectory(buildDirectory, path.join(functionDirectory, 'build'));
  await copyFileOrDirectory(
    path.join(clientDirectory, '.vite', 'manifest.json'),
    path.join(functionDirectory, 'dist', 'client', '.vite', 'manifest.json')
  );
  await copyFileOrDirectory(
    path.join(serverDirectory, 'package.json'),
    path.join(functionDirectory, 'package.json')
  );
  await copyFileOrDirectory(
    path.join(serverDirectory, 'node_modules'),
    path.join(functionDirectory, 'node_modules')
  );
  await writeFile(path.join(functionDirectory, 'api', 'index.js'), apiHandler);
  await writeFile(
    path.join(functionDirectory, '.vc-config.json'),
    JSON.stringify(vcConfig, null, 2)
  );

  // 3. Deployment config: serve static files first, route everything else to the function, and
  //    register the cron jobs.
  const crons = await readCrons({ buildDirectory });
  const config = {
    version: 3,
    routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: '/api' }],
  };
  if (crons.length > 0) {
    config.crons = crons;
  }
  await writeFile(path.join(outputDirectory, 'config.json'), JSON.stringify(config, null, 2));

  logger.info(
    { spin: 'succeed' },
    `Vercel Build Output assembled with ${crons.length} cron job${crons.length === 1 ? '' : 's'}.`
  );
  await context.sendTelemetry();
}

export default vercelOutput;
