#!/usr/bin/env node
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

import opener from 'opener';
import getContext from './getContext.mjs';
import acquireDevInstance from './utils/acquireDevInstance.mjs';
import createBuildActivity from './utils/createBuildActivity.mjs';
import startMailSink from './processes/startMailSink.mjs';
import startProxy from './processes/startProxy.mjs';
import startServer from './processes/startServer.mjs';
import formatNoticeBox from './utils/formatNoticeBox.mjs';
import resolvePorts from './utils/resolvePorts.mjs';
import waitForServer from './utils/waitForServer.mjs';

/*
The run script does the following:
  - Read .env, run the initial Lowdefy build and install plugins
  - Start file watchers to reload config and restart server if necessary
  - Start the server
  - Open a browser window.

  Watchers (see processes/startWatchers.mjs):

  ## Lowdefy build watcher
  Watches:
    - <config-dir>,
    - <watch-dirs>
    - !<ignore-dirs>
  The Lowdefy build watcher watches the Lowdefy config files for changes
  and runs Lowdefy build when they change, and triggers a soft reload.

  If lowdefy version in lowdefy.yaml
  is changed, the server warns and exits.

  ## .env watcher

  If the .env file is changed, the new file is parsed, and the server restarted with the new env
  and the server hard reloads.

  ## Local plugin, restart request and server package.json watchers

  A local plugin change rebuilds (and restarts when the plugin has server-side types), a restart
  requested by the dev tools rebuilds and restarts, and a plugin package a page build added to
  the server's package.json is installed.

  After every build, syncServer restarts the server when a file it read at start changed (config,
  auth, connections, server operators), installing new plugin packages first.

  # Reload mechanism

  The web client creates a Server Sent Events connection with the server on the /api/reload route.
  The server watches the <build-dir>/reload file, which is written every time the server should reload,
  and sends an event to the client to reload the config. The client then uses a SWR cache mutation to
  fetch the new config.

  If the server is restarted, the event stream is closed because the original server was shut down. The client starts
  pinging the /api/ping route, until it detects a new server has started, and then reloads the window.
 */

const context = await getContext();

const instance = acquireDevInstance({
  configDirectory: context.directories.config,
  owner: context.options.owner,
  version: context.version,
});
if (instance.acquired === false) {
  const { holder } = instance;
  const where = holder.port ? `, http://localhost:${holder.port}` : '';
  context.logger.error(
    `A dev server for this app is already running (${holder.owner ?? 'terminal'}${where}, pid ${
      holder.pid
    }). ` +
      'Two dev servers race writing the build directory. Use the running one, or stop it first.'
  );
  process.exit(1);
}
process.on('exit', () => instance.release());

// `building` is true while a change is queued or being processed, restarts
// included. lowdefy_build_status({ wait: true }) waits on it, so an agent
// reads the build that includes its last edit instead of the one before.
context.buildActivity = createBuildActivity({
  onChange: (building) => instance.update({ building }),
});

// Shut the Vite child down on direct signals (process managers, scripts/dev.mjs
// signal forwarding) — terminal Ctrl+C signals the whole process group, but a
// targeted SIGTERM would otherwise orphan the child.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    context.shutdownServer();
    process.exit(0);
  });
}

try {
  await context.initialBuild();

  // We are not waiting for the startWatchers promise to resolve (all watchers have fired the ready event)
  // because chokidar sometimes doesn't fire this event, and it seems like there isn't an issue with not waiting.
  context.startWatchers();

  // The manager is the component that binds the port, so it checks here to
  // cover every launch path (CLI, monorepo dev script, direct run.mjs) and any
  // process that grabbed the port during the initial build.
  const { port, internalPort } = await resolvePorts(context);
  context.options.port = port;
  context.internalPort = internalPort;
  instance.update({ port, internalPort });
  context.instance = instance;

  // The manager holds the public port for the whole session and proxies to the
  // Vite child on an internal loopback port — restarting the child (js module
  // or .env change) then never drops the listener, so long-lived clients (MCP
  // agents, the reload SSE stream, HMR websockets) reconnect instead of dying
  // on ECONNREFUSED.
  await startProxy(context);
  context.mailSink = await startMailSink(context);

  startServer(context);
  if (
    await waitForServer({
      basePath: context.basePath,
      child: context.devServer,
      port: context.internalPort,
    })
  ) {
    instance.update({ state: 'ready' });
  } else {
    context.logger.warn('The dev server did not answer within 2 minutes - check the output above.');
  }
  const docsUrl = `${context.url}/lowdefy-docs`;
  context.logger.info(
    { color: 'blue' },
    formatNoticeBox({
      title: 'Lowdefy coding agent tools',
      lines: [
        `Docs & MCP  ${docsUrl}`,
        '            run `lowdefy agent-setup` to connect your agent',
        '',
        'Annotate    Press Cmd/Ctrl+/ in the browser to point, draw,',
        '            and comment on the running app, then paste the',
        '            copied feedback into your coding agent session.',
        '',
        'Open code   Cmd/Ctrl+click any element in the browser to open',
        '            its yaml in VS Code at the defining line.',
      ],
    })
  );
  // A hub-owned server was started for an agent, not for a person at a browser.
  if (process.env.LOWDEFY_SERVER_DEV_OPEN_BROWSER === 'true' && context.options.owner !== 'hub') {
    // TODO: Wait 1 sec for a ping and don't open if a ping is seen
    opener(context.url);
  }
  await new Promise(() => {});
} catch (error) {
  context.logger.error(error);
  context.shutdownServer();
  process.exit();
}
