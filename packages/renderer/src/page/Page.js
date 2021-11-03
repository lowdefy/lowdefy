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
import { makeContextId } from '@lowdefy/engine';

import Block from './block/Block';
import Context from './block/Context';
import Helmet from './Helmet';
import setupLink from '../utils/setupLink';

const GET_PAGE = gql`
  query getPage($id: ID!) {
    page(pageId: $id)
  }
`;

const PageContext = (pageArgs) => {
  const { lowdefy } = pageArgs;
  const { initEventsTriggered } = pageArgs;
  const { pageId = useParams().pageId } = pageArgs;
  const { search = useLocation().search } = pageArgs;

  if (
    initEventsTriggered &&
    lowdefy.pageId &&
    lowdefy.pageId !== pageId &&
    lowdefy.pageId != lowdefy.initPageId
  ) {
    initEventsTriggered(false);
  }

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
    <div id={pageId}>
      <Context
        block={data.page}
        contextId={makeContextId({
          blockId: pageId,
          pageId,
          urlQuery: lowdefy.urlQuery,
        })}
        lowdefy={lowdefy}
        initEventsTriggered={initEventsTriggered}
      >
        {(context) => (
          <>
            <Helmet properties={context.RootBlocks.map[pageId].eval.properties} />
            <Block
              block={context.RootBlocks.map[pageId]}
              Blocks={context.RootBlocks}
              context={context}
              isRoot={true}
              lowdefy={lowdefy}
            />
          </>
        )}
      </Context>
    </div>
  );
};

export default PageContext;
