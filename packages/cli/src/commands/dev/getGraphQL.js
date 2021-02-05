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

import { createGetSecretsFromEnv } from '@lowdefy/node-utils';
import { ApolloServer } from 'apollo-server-express';

import getFederatedModule from '../../utils/getFederatedModule';

async function getGraphQl({ context }) {
  const { typeDefs, resolvers, createContext: createGqlContext } = await getFederatedModule({
    module: 'graphql',
    packageName: '@lowdefy/graphql-federated',
    version: context.lowdefyVersion,
    context,
  });
  const config = {
    CONFIGURATION_BASE_PATH: context.outputDirectory,
    logger: console,
    getSecrets: createGetSecretsFromEnv(),
  };
  const gqlContext = createGqlContext(config);
  const server = new ApolloServer({ typeDefs, resolvers, context: gqlContext });
  return server;
}

export default getGraphQl;
