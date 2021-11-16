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

import { useRouter } from 'next/router';

import Context from './Context.js';
import Head from './Head.js';
import Block from './block/Block.js';
import Root from './Root.js';
import setupLink from '../utils/setupLink.js';

const Page = ({ lowdefy, pageConfig, rootConfig }) => {
  const router = useRouter();
  lowdefy._internal.basePath = router.basePath;
  lowdefy._internal.pathname = router.pathname;
  lowdefy._internal.query = router.query;
  lowdefy._internal.router = router;
  lowdefy._internal.link = setupLink({ lowdefy });
  return (
    <Root lowdefy={lowdefy} rootConfig={rootConfig}>
      {(loaded) =>
        !loaded ? (
          <div>Loading</div>
        ) : (
          <Context config={pageConfig} lowdefy={lowdefy}>
            {(context) => (
              <>
                <Head
                  properties={context._internal.RootBlocks.map[pageConfig.pageId].eval.properties}
                />
                <Block
                  block={context._internal.RootBlocks.map[pageConfig.pageId]}
                  Blocks={context._internal.RootBlocks}
                  context={context}
                  lowdefy={lowdefy}
                />
              </>
            )}
          </Context>
        )
      }
    </Root>
  );
};

export default Page;
