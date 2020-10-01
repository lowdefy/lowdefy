import { gql } from 'apollo-server-core';

const typeDefs = gql`
  type Query {
    hello: String
  }
`
const resolvers = {
  Query: {
    hello: () => 'Hello',
  }
}
const createContext = () => ({})

export { typeDefs, resolvers, createContext };
