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

import { spawn } from 'child_process';

import readBasePath from '../utils/readBasePath.mjs';
import resolveDevAuthUrl from '../utils/resolveDevAuthUrl.mjs';

function createStdErrLineHandler({ context }) {
  const port = context.internalPort;
  return function stdErrLineHandler(line) {
    if (line.includes('EADDRINUSE')) {
      context.logger.error(
        `Internal port ${port} is already in use. Stop the other process or use a different port with --port.`
      );
      return;
    }
    context.logger.error(line);
  };
}

function startServer(context) {
  context.shutdownServer();

  // The app, its API and the /lowdefy-docs tools all live under basePath, and
  // a config change that edits basePath restarts the child - so the URL is
  // recorded on every start. Everything that finds this server through
  // .lowdefy/instance.json (lowdefy mcp, the hub, lowdefy test) appends its
  // paths to this URL.
  context.basePath = readBasePath(context);
  context.url = `http://localhost:${context.options.port}${context.basePath}`;
  context.instance.update({ url: context.url });
  // What this server reads at start, so a later build restarts it only when
  // one of those files changed.
  context.serverArtifacts.record();

  // Read on every start: a .env edit can change BETTER_AUTH_URL, and the
  // watcher restarts the child with the reloaded value.
  const configuredAuthUrl = process.env.BETTER_AUTH_URL;
  const { authUrl, rewritten } = resolveDevAuthUrl({
    configured: configuredAuthUrl,
    port: context.options.port,
  });
  if (rewritten && context.loggedAuthUrl !== authUrl) {
    context.logger.info(
      `BETTER_AUTH_URL ${configuredAuthUrl} names another port; this dev server uses ${authUrl}.`
    );
    context.loggedAuthUrl = authUrl;
  }

  // The child binds context.internalPort on loopback; the manager's proxy owns
  // the public context.options.port (see startProxy.mjs) so a restart never
  // drops the listener that browsers, SSE reload streams and MCP agents hold.
  const devServer = spawn(
    'node',
    [
      context.bin.vite,
      '--host',
      '127.0.0.1',
      '--port',
      String(context.internalPort),
      '--strictPort',
    ],
    {
      stdio: ['ignore', 'inherit', 'pipe'],
      env: {
        ...process.env,
        LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
        // Set only while the manager's mail sink listens: the child cannot
        // tell from LOWDEFY_DEV_SMTP_PORT alone, which a later .env edit can
        // add without a sink (it starts once, with the manager).
        LOWDEFY_SERVER_DEV_MAIL_SINK: context.mailSink ? 'true' : undefined,
        PORT: context.internalPort,
        BETTER_AUTH_URL: authUrl,
      },
    }
  );

  const stdErrLineHandler = createStdErrLineHandler({ context });
  devServer.stderr.on('data', (data) => {
    data
      .toString('utf8')
      .split('\n')
      .forEach((line) => {
        if (line) stdErrLineHandler(line);
      });
  });

  context.logger.debug(`Started dev server with pid ${devServer.pid}.`);
  devServer.on('exit', (code, signal) => {
    context.logger.debug(`devServer exit ${devServer.pid}, signal: ${signal}, code: ${code}`);
  });
  devServer.on('error', (error) => {
    context.logger.error(error);
  });
  context.devServer = devServer;
}

export default startServer;
