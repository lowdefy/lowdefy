/*
  Copyright 2020-2021 Lowdefy, Inc

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
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs, resolvers, createContext } from '@lowdefy/graphql';
import { get } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';

function getServer({
  development = false,
  configurationBasePath,
  gqlUri,
  logger,
  getSecrets,
  serveStaticFiles = true,
}) {
  const context = createContext({
    CONFIGURATION_BASE_PATH: configurationBasePath,
    development,
    getSecrets,
    gqlUri,
    logger,
  });
  const gqlServer = new ApolloServer({
    typeDefs,
    resolvers,
    context,
  });

  let indexHtml = null;

  const serveIndex = async (req, res) => {
    if (!indexHtml) {
      indexHtml = await readFile(path.resolve(process.cwd(), 'dist/shell/index.html'));
      let appConfig = await readFile(path.resolve(configurationBasePath, 'app.json'));
      appConfig = JSON.parse(appConfig);
      indexHtml = indexHtml.replace(
        '<!-- __LOWDEFY_APP_HEAD_HTML__ -->',
        get(appConfig, 'html.appendHead', { default: '' })
      );
      indexHtml = indexHtml.replace(
        '<!-- __LOWDEFY_APP_BODY_HTML__ -->',
        get(appConfig, 'html.appendBody', { default: '' })
      );
    }
    res.send(indexHtml);
  };

  const server = express();

  gqlServer.applyMiddleware({ app: server, path: '/api/graphql' });

  if (serveStaticFiles) {
    // serve index.html with appended html
    // else static server serves without appended html
    server.get('/', serveIndex);

    // Serve webpack and public files from './dist/shell'
    server.use(express.static('dist/shell'));

    // Redirect all 404 to index.html with status 200
    // This should always be the last route
    server.use(serveIndex);
  }
  return server;
}

export default getServer;
