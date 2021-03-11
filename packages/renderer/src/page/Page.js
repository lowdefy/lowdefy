/* eslint-disable react/destructuring-assignment */

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

import React from 'react';
import { useParams, useHistory, useLocation, Redirect } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

import { Loading } from '@lowdefy/block-tools';
import { get, urlQuery } from '@lowdefy/helpers';

import Helmet from './Helmet';
import Block from './block/Block';
import Context from './block/Context';
import setupLink from '../utils/setupLink';

const GET_PAGE = gql`
  query getPage($id: ID!) {
    page(pageId: $id)
  }
`;

const PageContext = ({ lowdefy }) => {
  const { pageId } = useParams();
  const { search } = useLocation();
  lowdefy.pageId = pageId;
  lowdefy.routeHistory = useHistory();
  lowdefy.link = setupLink(lowdefy);
  lowdefy.urlQuery = urlQuery.parse(search || '');

  const { loading, error, data } = useQuery(GET_PAGE, {
    variables: { id: pageId },
  });
  if (loading) {
    return <Loading type="Spinner" properties={{ height: '100vh' }} />;
  }
  // if (error) throw error;
  if (error) {
    console.log(error);
    return <div>Error</div>;
  }
  // redirect 404
  if (!data.page) return <Redirect to="/404" />;

  // Prefetch all prefetchPages to Apollo cache
  get(data.page, 'properties.prefetchPages', { default: [] }).map((fetchPageId) =>
    lowdefy.client.query({
      query: GET_PAGE,
      variables: { id: fetchPageId },
    })
  );

  return (
    <>
      <Helmet pageProperties={get(data.page, 'properties', { default: {} })} />
      <div id={pageId}>
        <Context
          block={{
            id: `root:${pageId}`,
            blockId: `root:${pageId}`,
            type: 'Context',
            meta: {
              category: 'context',
            },
            areas: { root: { blocks: [data.page] } },
          }}
          context={null}
          contextId={`root:${pageId}`}
          lowdefy={lowdefy}
          render={(context) => (
            <Block
              block={context.RootBlocks.map[data.page.blockId]}
              Blocks={context.RootBlocks}
              context={context}
              lowdefy={lowdefy}
            />
          )}
        />
      </div>
    </>
  );
};

export default PageContext;
