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
            url: 'https://unpkg.com/izlrmfxlki/dist/remoteEntry.js',
            scope: 'izlrmfxlki',
            module: 'Button',
          },
        },
      ],
    }),
  },
};
const createContext = () => ({});

export { typeDefs, resolvers, createContext };
