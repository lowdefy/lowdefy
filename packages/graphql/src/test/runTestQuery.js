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

import { ApolloServer } from 'apollo-server';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createTestClient } from 'apollo-server-testing';
import typeDefs from '../schema';
import resolvers from '../resolvers/resolvers';
import { testContext } from './testContext';

async function runTestQuery({ gqlQuery, variables, loaders, getSecrets, setHeader }) {
  const context = await testContext({ loaders, getSecrets, setHeader });
  const server = new ApolloServer({ typeDefs, resolvers, context });
  const { query } = createTestClient(server);
  return query({
    query: gqlQuery,
    variables,
  });
}

export default runTestQuery;
