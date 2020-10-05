const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers, createContext } = require('@lowdefy/poc-graphql');
const context = createContext();
const server = new ApolloServer({ typeDefs, resolvers, context });
const app = express();

server.applyMiddleware({ app });
app.use(express.static('shell/dist'));
app.listen({ port: 4000 }, () => console.log(`🚀 Server ready at http://localhost:4000`));
