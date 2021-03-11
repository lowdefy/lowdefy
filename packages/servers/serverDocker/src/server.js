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
import { createGetSecretsFromEnv } from '@lowdefy/node-utils';

const config = {
  CONFIGURATION_BASE_PATH: path.resolve(process.cwd(), './build'),
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
app.use((req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'dist/shell/index.html'));
});

app.listen({ port: 3000 }, () => console.log(`Server started at port 3000`));
