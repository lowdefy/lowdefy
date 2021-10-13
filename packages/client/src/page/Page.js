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
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { urlQuery } from '@lowdefy/helpers';

import usePageData from '../swr/usePageData';
import Block from './block/Block';
import Context from './Context';
import Helmet from './Helmet';
import setupLink from '../utils/setupLink';

const Page = ({ lowdefy }) => {
  console.log('Page', lowdefy);
  const { pageId } = useParams();
  const { search } = useLocation();
  lowdefy.pageId = pageId;
  lowdefy.routeHistory = useHistory();
  lowdefy.link = setupLink(lowdefy);
  lowdefy.urlQuery = urlQuery.parse(search || '');

  const { data: page } = usePageData(pageId);
  console.log('page', page);
  return (
    <div id={pageId}>
      <Context page={page} lowdefy={lowdefy}>
        {(context) => (
          <>
            <Helmet properties={context.RootBlocks.map[pageId].eval.properties} />
            <Block
              block={context.RootBlocks.map[pageId]}
              Blocks={context.RootBlocks}
              context={context}
              lowdefy={lowdefy}
            />
          </>
        )}
      </Context>
    </div>
  );
};

export default Page;
