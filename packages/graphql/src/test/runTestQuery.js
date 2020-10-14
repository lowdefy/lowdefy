import { ApolloServer } from 'apollo-server';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createTestClient } from 'apollo-server-testing';
import typeDefs from '../schema';
import resolvers from '../resolvers/resolvers';
import testContext from './testContext';

async function runTestQuery({ gqlQuery, variables, loaders, setters }) {
  const context = await testContext({ loaders, setters });
  const server = new ApolloServer({ typeDefs, resolvers, context });
  const { query } = createTestClient(server);
  return query({
    query: gqlQuery,
    variables,
  });
}

export default runTestQuery;
