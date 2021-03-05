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
import { ApolloServer } from 'apollo-server-lambda';
import { typeDefs, resolvers, createContext } from '@lowdefy/graphql';
import { createGetSecretsFromEnv } from '@lowdefy/node-utils';

const config = {
  CONFIGURATION_BASE_PATH: path.resolve(__dirname, './build'),
  getHeaders: ({ event }) => event.headers,
  getSecrets: createGetSecretsFromEnv(),
  logger: console,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext(config),
});

const handler = server.createHandler();

export { handler };
