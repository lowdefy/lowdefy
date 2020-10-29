/*
  Copyright 2020 Lowdefy, Inc

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

import http from 'http';
import path from 'path';
import chokidar from 'chokidar';
import express from 'express';
import reload from 'reload';
import opener from 'opener';

import BatchChanges from '../../utils/BatchChanges';
import createContext from '../../utils/context';
import getBuildScript from '../build/getBuildScript';
import { outputDirectoryPath } from '../../utils/directories';

const template = (count) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lowdefy App</title>
    <script src="/api/reload/reload.js"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">Reload count: ${count}</div>
  </body>
</html>
`;

async function dev(options) {
  let count = 1;

  // Setup
  if (!options.port) options.port = 3000;
  const context = await createContext(options);
  await getBuildScript(context);
  context.print.info('Starting development server.');

  // Express
  const app = express();
  app.set('port', options.port);

  const server = http.createServer(app);
  app.get('/', (req, res) => {
    res.send(template(count));
  });
  const reloadReturned = await reload(app, { route: '/api/reload/reload.js' });

  // File watcher
  const fn = () => {
    context.print.info('Building configuration.');
    count += 1;
    context.buildScript({
      logger: context.print,
      cacheDirectory: context.cacheDirectory,
      configDirectory: context.baseDirectory,
      outputDirectory: path.resolve(context.baseDirectory, outputDirectoryPath),
    });
    reloadReturned.reload();
  };
  const batchChanges = new BatchChanges({ fn, context });

  const watcher = chokidar.watch('.', {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
  });
  watcher.on('add', () => batchChanges.newChange());
  watcher.on('change', () => batchChanges.newChange());
  watcher.on('unlink', () => batchChanges.newChange());

  // Start server
  server.listen(app.get('port'), function () {
    context.print.log(`Development server listening on port ${options.port}`);
  });
  opener(`http://localhost:${options.port}`);
}

export default dev;
