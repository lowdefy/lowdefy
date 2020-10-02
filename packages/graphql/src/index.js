import { gql } from 'apollo-server-core';
import GraphQLJSON from 'graphql-type-json';

const typeDefs = gql`
  scalar JSON
  type Query {
    hello: String
    page: JSON
  }
`;
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    hello: () => 'Hello',
    page: () => ({
      blocks: [
        {
          id: 1,
          meta: {
            url: 'http://localhost:3002/remoteEntry.js',
            scope: 'button',
            module: 'Button',
          },
        },
      ],
    }),
  },
};
const createContext = () => ({});

export { typeDefs, resolvers, createContext };
