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
import { useQuery, gql } from '@apollo/client';
import { Loading, makeCssClass, blockDefaults, ErrorBoundary } from '@lowdefy/block-tools';

import AutoBlock from './AutoBlock';
import prepareBlock from './prepareBlock';

const getBlock = gql`
  query getBlock($id: String!) {
    block(id: $id) @client {
      id
      t
    }
  }
`;

const BindAutoBlock = ({ block, Blocks, context, pageId, rootContext }) => {
  const { loading, error, data } = useQuery(getBlock, {
    variables: {
      id: `BlockClass:${block.id}`,
    },
    client: rootContext.client,
  });

  if (loading) return 'Loading render watcher';
  if (error) throw error;
  if (block.eval.visible === false)
    return <div id={`vs-${block.blockId}`} style={{ display: 'none' }} />;

  const Component = prepareBlock({
    block,
    Components: rootContext.Components,
  });

  if (data.block.loading) {
    return (
      <Loading
        id={`lo-${block.blockId}-loading`}
        meta={block.meta}
        methods={{ makeCssClass }}
        blockStyle={block.eval.style || {}}
      />
    );
  }
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Loading
            id={`sp-${block.blockId}-loading`}
            meta={block.meta}
            methods={{ makeCssClass }}
          />
        }
      >
        <AutoBlock
          block={block}
          Blocks={Blocks}
          Component={blockDefaults(Component)}
          context={context}
          pageId={pageId}
          rootContext={rootContext}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

export default BindAutoBlock;
