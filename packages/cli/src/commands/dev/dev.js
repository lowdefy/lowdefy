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

import path from 'path';
import chokidar from 'chokidar';
import express from 'express';
import reload from 'reload';
import opener from 'opener';
import { ApolloServer } from 'apollo-server-express';

import BatchChanges from '../../utils/BatchChanges';
import createContext from '../../utils/context';
import getBuildScript from '../build/getBuildScript';
import getGraphql from './getGraphql';
import createGetSecretsFromEnv from './createGetSecretsFromEnv';
import { outputDirectoryPath } from '../../utils/directories';

async function dev(options) {
  // Setup
  if (!options.port) options.port = 3000;
  const context = await createContext(options);
  await getBuildScript(context);
  await getGraphql(context);

  context.print.info('Starting development server.');

  //Graphql
  const config = {
    CONFIGURATION_BASE_PATH: path.resolve(process.cwd(), './.lowdefy/build'),
    logger: console,
    getSecrets: createGetSecretsFromEnv(),
  };
  const { typeDefs, resolvers, createContext: createGqlContext } = context.graphql;
  const gqlContext = createGqlContext(config);
  const server = new ApolloServer({ typeDefs, resolvers, context: gqlContext });

  // Express
  const app = express();
  app.set('port', options.port);
  server.applyMiddleware({ app, path: '/api/graphql' });
  const reloadReturned = await reload(app, { route: '/api/dev/reload.js' });
  app.use(express.static(path.join(__dirname, 'shell')));
  app.use('/api/dev/version', (req, res) => {
    res.json(context.version);
  });
  app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, 'shell/index.html'));
  });

  // File watcher
  const fn = async () => {
    context.print.info('Building configuration.');
    await context.buildScript({
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
  app.listen(app.get('port'), function () {
    context.print.log(`Development server listening on port ${options.port}`);
  });
  opener(`http://localhost:${options.port}`);
}

export default dev;
