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

// eslint-disable-next-line no-unused-vars
import { gql } from 'apollo-server';
import runTestQuery from '../../../test/runTestQuery';

import authenticated from './authenticated';

// Controller mocks
const getController = jest.fn((name) => {
  if (name === 'authorization') {
    return {
      authenticated: 'testAuthenticated',
    };
  }
});

test('openIdLogoutUrl resolver', async () => {
  const res = await authenticated(null, null, { getController });
  expect(res).toEqual('testAuthenticated');
});

test('openIdLogoutUrl graphql', async () => {
  const GET_AUTHENTICATED = gql`
    query getAuthenticated {
      authenticated
    }
  `;
  const res = await runTestQuery({
    gqlQuery: GET_AUTHENTICATED,
    variables: {},
    user: { sub: 'sub' },
  });
  expect(res.errors).toBe(undefined);
  expect(res.data).toEqual({
    authenticated: true,
  });
});
