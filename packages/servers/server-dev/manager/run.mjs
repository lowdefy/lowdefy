#!/usr/bin/env node
/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { wait } from '@lowdefy/helpers';
import opener from 'opener';
import getContext from './getContext.mjs';
import startServer from './processes/startServer.mjs';

/*
The run script does the following:
  - Run the initial Lowdefy build, install plugins, and next build and read .env
  - Start file watchers to reload config and restart server if necessary
  - Start the server
  - Open a browser window.

  Three watchers are started:

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

  ## Next build watcher

  The Next build watcher watches for any files where the app should be rebuilt and restarted.
  It watches:
  - <build-dir>/plugins/**
  - <build-dir>/config.json
  - <server-dir>/package.json

  If app config changes:
    - <build-dir>/config.json changes, rebuild and restart server.

  If user styles change:
    - <public-dir>/styles.less changes, rebuild and restart server.

  If new plugin type in an existing plugin package is used:
    - <build-dir>/plugins/** changes,  rebuild next and restart server.

  If new plugin type in a new plugin package is used:
    - <server-dir>/package.json changes,  run npm install, rebuild next and restart server.

  # Reload mechanism

  The web client creates a Server Sent Events connection with the server on the /api/reload route.
  The server watches the <build-dir>/reload file, which is written every time the server should reload,
  and sends an event to the client to reload the config. The client then uses a SWR cache mutation to
  fetch the new config.

  If the server is restarted, the event stream is closed because the original server was shut down. The client starts
  pinging the /api/ping route, until it detects a new server has started, and then reloads the window.
 */

/* TODO:
Not killing server on errors properly
when:
- initial build fails
*/

const context = await getContext();

try {
  try {
    await context.initialBuild();
  } catch (error) {
    context.logger.error(error);
  }

  // We are not waiting for the startWatchers promise to resolve (all watchers have fired the ready event)
  // because chokidar sometimes doesn't fire this event, and it seems like there isn't an issue with not waiting.
  context.startWatchers();

  startServer(context);
  await wait(800);
  if (process.env.LOWDEFY_SERVER_DEV_OPEN_BROWSER === 'true') {
    // TODO: Wait 1 sec for a ping and don't open if a ping is seen
    opener(`http://localhost:${context.options.port}`);
  }
  await new Promise(() => {});
} catch (error) {
  context.logger.error(error);
  context.shutdownServer();
  process.exit();
}
