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

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers, createContext } = require('@lowdefy/graphql');

const contextOptions = {
  DEPLOYMENT_ID: 'DEPLOYMENT_ID',
  DEPLOYMENT_NAME: 'DEPLOYMENT_NAME',
  DOMAIN_NAME: 'DOMAIN_NAME',
  logger: console,
  getHeadersFromInput: ({ req }) => req.headers,
  getSecrets: () => ({
    CONNECTION_SECRETS: {},
  }),
};

const context = createContext(contextOptions);
const server = new ApolloServer({ typeDefs, resolvers, context });
const app = express();

server.applyMiddleware({ app });
app.use(express.static('shell/dist'));
app.listen({ port: 4000 }, () => console.log(`🚀 Server ready at http://localhost:4000`));
