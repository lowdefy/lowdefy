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

import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs, resolvers, createContext } from '@lowdefy/graphql';
import { createGetSecretsFromEnv, readFile } from '@lowdefy/node-utils';

dotenv.config({ silent: true });
const config = {
  CONFIGURATION_BASE_PATH: path.resolve(process.cwd(), './.lowdefy/build'),
  development: true,
  getSecrets: createGetSecretsFromEnv(),
  logger: console,
};

const context = createContext(config);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
});
const app = express();

server.applyMiddleware({ app, path: '/api/graphql' });

// Serve Webpack shell files from './shell/dist'
app.use(express.static('dist/shell'));

// Redirect all 404 to index.html with status 200
// This should always be the last route
app.use(async (req, res) => {
  let indexHtml = await readFile(path.resolve(process.cwd(), 'dist/shell/index.html'));
  let appConfig = await readFile(path.resolve(config.CONFIGURATION_BASE_PATH, 'app.json'));
  appConfig = JSON.parse(appConfig);
  indexHtml = indexHtml.replace('<!-- __LOWDEFY_APP_HEAD_HTML__ -->', appConfig.html.appendHead);
  indexHtml = indexHtml.replace('<!-- __LOWDEFY_APP_BODY_HTML__ -->', appConfig.html.appendBody);
  res.send(indexHtml);
});

app.listen({ port: 3000 }, () => console.log(`🚀 Server ready at http://localhost:3000`));
