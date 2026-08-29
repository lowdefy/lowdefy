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
import { cleanDirectory, copyFileOrDirectory, readFile, writeFile } from '@lowdefy/node-utils';

import apiHandler from './apiHandler.js';
import copyTracedFiles from '../../utils/copyTracedFiles.js';
import findTraceBase from '../../utils/findTraceBase.js';

// Function settings come from lowdefy.yaml `config.vercel` (written to build/config.json by
// @lowdefy/build). maxDuration defaults to 60; plan limits are enforced by Vercel at deploy time.
async function readFunctionConfig({ buildDirectory }) {
  const raw = await readFile(path.join(buildDirectory, 'config.json'));
  const config = raw ? JSON.parse(raw) : {};
  const vercel = config.vercel ?? {};
  return {
    maxDuration: vercel.maxDuration ?? 60,
    ...(vercel.memory ? { memory: vercel.memory } : {}),
  };
}

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

  const serverDirectory = path.resolve(directories.server);
  const buildDirectory = path.resolve(directories.build);
  const clientDirectory = path.join(serverDirectory, 'dist', 'client');
  const outputDirectory = path.join(serverDirectory, '.vercel', 'output');
  const staticDirectory = path.join(outputDirectory, 'static');
  const functionDirectory = path.join(outputDirectory, 'functions', 'api.func');

  const entrypoints = [
    path.join(serverDirectory, 'src', 'index.js'),
    path.join(serverDirectory, 'src', 'app.js'),
  ];
  entrypoints.forEach((entrypoint) => {
    if (!fs.existsSync(entrypoint)) {
      throw new Error(`Cannot trace "${entrypoint}" — run "lowdefy build" first.`);
    }
  });
  if (!fs.existsSync(clientDirectory)) {
    throw new Error(
      `Cannot find built client at "${clientDirectory}" — run "lowdefy build" first.`
    );
  }

  // The function preserves paths relative to the trace base (the pnpm workspace root when the
  // server directory is a workspace member), so the server's relative node_modules symlinks still
  // resolve inside the function. The server lands at <relServer>/ inside api.func.
  const base = findTraceBase({ serverDirectory });
  const relServer = path.relative(base, serverDirectory);
  const functionServerDirectory = path.join(functionDirectory, relServer);

  // Start clean so artifacts from a previous build do not leak into the deployment.
  await cleanDirectory(outputDirectory);

  // 1. Static assets + public files served by the Vercel CDN.
  await copyFileOrDirectory(clientDirectory, staticDirectory);

  // 2. The runtime file closure of the Hono server, traced with @vercel/nft — the app source, the
  //    build-generated plugin import files, and exactly the node_modules files they resolve to
  //    (through pnpm's symlinks, which are preserved).
  const fileCount = await copyTracedFiles({
    base,
    entrypoints,
    functionDirectory,
    logger,
    processCwd: serverDirectory,
  });
  logger.info(`Traced ${fileCount} runtime files into the function.`);

  // 3. Artifacts the server reads from the filesystem at runtime (not imported, so not traced),
  //    plus src/ and lib/ wholesale as belt-and-braces alongside the traced copies.
  await copyFileOrDirectory(
    path.join(serverDirectory, 'src'),
    path.join(functionServerDirectory, 'src')
  );
  await copyFileOrDirectory(
    path.join(serverDirectory, 'lib'),
    path.join(functionServerDirectory, 'lib')
  );
  await copyFileOrDirectory(buildDirectory, path.join(functionServerDirectory, 'build'));
  await copyFileOrDirectory(
    path.join(clientDirectory, '.vite', 'manifest.json'),
    path.join(functionServerDirectory, 'dist', 'client', '.vite', 'manifest.json')
  );
  await copyFileOrDirectory(
    path.join(serverDirectory, 'package.json'),
    path.join(functionServerDirectory, 'package.json')
  );

  // 4. The function entry and its config. The handler path is relative to the api.func root.
  const handler = path.posix.join(...relServer.split(path.sep), 'api', 'index.js');
  const functionConfig = await readFunctionConfig({ buildDirectory });
  await writeFile(path.join(functionServerDirectory, 'api', 'index.js'), apiHandler);
  await writeFile(
    path.join(functionDirectory, '.vc-config.json'),
    JSON.stringify(
      {
        runtime: 'nodejs22.x',
        handler,
        launcherType: 'Nodejs',
        ...functionConfig,
      },
      null,
      2
    )
  );

  // 5. Deployment config: serve static files first, route everything else to the function, and
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
