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

import { gql } from 'apollo-server';
import runTestQuery from '../../../test/runTestQuery';
import lowdefyGlobal from './lowdefyGlobal';

const mockLoadGlobal = jest.fn((id) => {
  if (id === 'global') {
    return {
      global: true,
    };
  }
  return null;
});

const mockGetLowdefyGlobal = jest.fn(() => {
  return {
    global: true,
  };
});

const getController = jest.fn(() => ({
  getLowdefyGlobal: mockGetLowdefyGlobal,
}));

const loaders = {
  component: {
    load: mockLoadGlobal,
  },
};
const setters = {};

const GET_GLOBAL = gql`
  query getGlobal {
    lowdefyGlobal
  }
`;

test('global resolver', async () => {
  const res = await lowdefyGlobal(null, null, { getController });
  expect(res).toEqual({
    global: true,
  });
});

test('lowdefyGlobal graphql', async () => {
  const res = await runTestQuery({
    gqlQuery: GET_GLOBAL,
    loaders,
    setters,
  });
  expect(res.errors).toBe(undefined);
  expect(res.data).toEqual({
    lowdefyGlobal: {
      global: true,
    },
  });
});
