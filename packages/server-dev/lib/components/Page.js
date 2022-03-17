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

import Block from './block/Block.js';
import Context from './Context.js';
import Head from './Head.js';
import usePageConfig from '../utils/usePageConfig.js';

const LoadingBlock = () => <div>Loading...</div>;

const Page = ({ lowdefy }) => {
  const { data: pageConfig } = usePageConfig(lowdefy.pageId, lowdefy.basePath);
  if (!pageConfig) {
    lowdefy._internal.router.replace(`/404`);
    return <LoadingBlock />;
  }
  return (
    <Context config={pageConfig} lowdefy={lowdefy}>
      {(context, loading) => {
        if (loading) {
          return <LoadingBlock />;
        }
        return (
          <>
            <Head properties={context._internal.RootBlocks.map[pageConfig.id].eval.properties} />
            <Block
              block={context._internal.RootBlocks.map[pageConfig.id]}
              Blocks={context._internal.RootBlocks}
              context={context}
              lowdefy={lowdefy}
            />
          </>
        );
      }}
    </Context>
  );
};

export default Page;
