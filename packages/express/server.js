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

const path = require('path');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers, createContext } = require('@lowdefy/graphql');

const config = {
  DEPLOYMENT_ID: 'DEPLOYMENT_ID',
  DEPLOYMENT_NAME: 'DEPLOYMENT_NAME',
  DOMAIN_NAME: 'DOMAIN_NAME',
  CONFIGURATION_BASE_PATH: path.resolve(process.cwd(), 'config'),
  logger: console,
  getHeadersFromInput: ({ req }) => req.headers,
  getSecrets: () => ({
    CONNECTION_SECRETS: {},
  }),
};

const context = createContext(config);
const server = new ApolloServer({ typeDefs, resolvers, context });
const app = express();

server.applyMiddleware({ app, path: '/api/graphql' });

// Serve Webpack shell files from './shell/dist'
app.use(express.static('shell/dist'));

// Redirect all 404 to index.html with status 200
// This should always be the last route
app.use((req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'shell/dist/index.html'));
});

app.listen({ port: 3000 }, () => console.log(`🚀 Server ready at http://localhost:3000`));
