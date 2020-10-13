import { gql } from '@apollo/client';
import GraphQLJSON from 'graphql-type-json';

const typeDefs = gql`
  extend type Query {
    block(id: String!): BlockClass
    pageState(id: String!): PageState
  }

  type BlockClass {
    id: String!
    t: Int
  }
`;

const GET_BLOCK = gql`
  fragment getBlockCache on BlockClass @client {
    id
    t
  }
`;

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    block: (parent, args, { cache }) => {
      try {
        return cache.readFragment({
          id: args.id,
          fragment: GET_BLOCK,
        });
      } catch (e) {
        console.log(e);
      }
      return null;
    },
  },
};

export { typeDefs, resolvers };
