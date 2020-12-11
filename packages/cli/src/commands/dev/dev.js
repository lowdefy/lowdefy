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
import dotenv from 'dotenv';
import express from 'express';
import reload from 'reload';
import opener from 'opener';
import { ApolloServer } from 'apollo-server-express';
import { createGetSecretsFromEnv, cleanDirectory } from '@lowdefy/node-utils';

import BatchChanges from '../../utils/BatchChanges';
import startUp from '../../utils/startUp';
import getFederatedModule from '../../utils/getFederatedModule';
import { outputDirectoryPath } from '../../utils/directories';

async function dev(options) {
  dotenv.config({ silent: true });
  // Setup
  if (!options.port) options.port = 3000;
  const context = await startUp(options);
  const { default: buildScript } = await getFederatedModule({
    module: 'build',
    packageName: '@lowdefy/build',
    version: context.version,
    context,
  });

  const { typeDefs, resolvers, createContext: createGqlContext } = await getFederatedModule({
    module: 'graphql',
    packageName: '@lowdefy/graphql-federated',
    version: context.version,
    context,
  });
  context.print.log(
    `Cleaning block meta cache at "${path.resolve(context.cacheDirectory, './meta')}".`
  );
  await cleanDirectory(path.resolve(context.cacheDirectory, './meta'));
  context.print.log('Starting Lowdefy development server.');

  //Graphql
  const config = {
    CONFIGURATION_BASE_PATH: path.resolve(process.cwd(), './.lowdefy/build'),
    logger: console,
    getSecrets: createGetSecretsFromEnv(),
  };
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
  const build = async () => {
    context.print.log('Building configuration.');
    await buildScript({
      logger: context.print,
      cacheDirectory: context.cacheDirectory,
      configDirectory: context.baseDirectory,
      outputDirectory: path.resolve(context.baseDirectory, outputDirectoryPath),
    });
    context.print.succeed('Built succesfully.');
    reloadReturned.reload();
  };
  const buildBatchChanges = new BatchChanges({ fn: build, context });

  const changeEnv = async () => {
    context.print.warn('.env file changed. You should restart your development server.');
    process.exit();
  };

  const changeEnvBatchChanges = new BatchChanges({ fn: changeEnv, context });

  const buildWatcher = chokidar.watch('.', {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
  });
  buildWatcher.on('add', () => buildBatchChanges.newChange());
  buildWatcher.on('change', () => buildBatchChanges.newChange());
  buildWatcher.on('unlink', () => buildBatchChanges.newChange());

  const envWatcher = chokidar.watch('./.env', {
    persistent: true,
  });
  envWatcher.on('change', () => changeEnvBatchChanges.newChange());

  // Start server
  app.listen(app.get('port'), function () {
    context.print.info(`Development server listening on port ${options.port}`);
  });
  opener(`http://localhost:${options.port}`);
}

export default dev;
