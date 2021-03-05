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

import { gql } from 'apollo-server';
import runTestQuery from '../../../test/runTestQuery';
import page from './page';

const mockLoadPage = jest.fn((id) => {
  if (id === 'pageId') {
    return {
      id: 'page:pageId',
      type: 'PageHeaderMenu',
      pageId: 'pageId',
      blockId: 'pageId',
    };
  }
  return null;
});

const mockGetPage = jest.fn(({ pageId }) => {
  return mockLoadPage(pageId);
});

const getController = jest.fn(() => ({
  getPage: mockGetPage,
}));

const loaders = {
  page: {
    load: mockLoadPage,
  },
};

const GET_PAGE = gql`
  query getPage($id: ID!) {
    page(pageId: $id)
  }
`;

test('page resolver', async () => {
  const res = await page(null, { pageId: 'pageId' }, { getController });
  expect(res).toEqual({
    id: 'page:pageId',
    type: 'PageHeaderMenu',
    pageId: 'pageId',
    blockId: 'pageId',
  });
});

test('page graphql', async () => {
  const res = await runTestQuery({
    gqlQuery: GET_PAGE,
    variables: { id: 'pageId' },
    loaders,
  });
  expect(res.errors).toBe(undefined);
  expect(res.data).toEqual({
    page: {
      id: 'page:pageId',
      type: 'PageHeaderMenu',
      pageId: 'pageId',
      blockId: 'pageId',
    },
  });
});
