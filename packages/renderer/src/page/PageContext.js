/* eslint-disable react/destructuring-assignment */

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

import React, { Suspense } from 'react';
import { useParams, useHistory, useLocation, Redirect } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

import { Loading, connectBlock } from '@lowdefy/block-tools';
import get from '@lowdefy/get';
import { urlQuery } from '@lowdefy/helpers';

import AutoBlock from './AutoBlock';
import Helmet from './Helmet';
import prepareBlock from './prepareBlock';

const GET_PAGE = gql`
  query getPage($id: ID!) {
    page(pageId: $id)
  }
`;

const PageContext = ({ rootContext }) => {
  const { pageId } = useParams();
  rootContext.routeHistory = useHistory();
  const { search } = useLocation();
  rootContext.urlQuery = urlQuery.parse(search || '');
  const { loading, error, data } = useQuery(GET_PAGE, {
    variables: { id: pageId, branch: rootContext.branch },
  });
  if (loading) {
    console.log('loading');
    return Loading;
  }
  // if (error) throw error;
  if (error) {
    console.log(error);
    return <div>Error</div>;
  }
  console.log('finished loading');
  // redirect 404
  if (!data.page) return <Redirect to="/404" />;

  console.log('data', data.page);
  const Component = prepareBlock({
    block: data.page,
    Components: rootContext.Components,
  });

  return (
    <>
      <Helmet pageProperties={get(data.page, 'properties', { default: {} })} />
      <div>Hello</div>
      <div id={pageId}>
        <Suspense fallback={<Loading />}>
          <AutoBlock
            block={data.page}
            Blocks={null}
            Component={connectBlock(Component)}
            context={null}
            pageId={pageId}
            rootContext={rootContext}
          />
        </Suspense>
      </div>
    </>
  );
};

export default PageContext;
