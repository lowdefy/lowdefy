/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { BlockLayout } from '@lowdefy/layout';
import { makeCssClass } from '@lowdefy/block-utils';

import LoadingContainer from './LoadingContainer.js';
import LoadingList from './LoadingList.js';

const LoadingBlock = ({ blockLayout, blockId, context, lowdefy, skeleton }) => {
  let Component = lowdefy._internal.blockComponents[skeleton.type];
  if (!Component) {
    // default to box when a skeleton block is not found - should be a basic or loader block.
    // TODO: Always throw a warning if blocks other than basic or loader are used in a skeleton.
    Component = lowdefy._internal.blockComponents.Box;
  }
  const layout = skeleton.layout || blockLayout || {};
  switch (Component.meta.category) {
    case 'list':
      return (
        <LoadingList
          blockId={blockId}
          Component={Component}
          context={context}
          layout={layout}
          lowdefy={lowdefy}
          skeleton={skeleton}
        />
      );
    case 'container':
      return (
        <LoadingContainer
          blockId={blockId}
          Component={Component}
          context={context}
          layout={layout}
          lowdefy={lowdefy}
          skeleton={skeleton}
        />
      );
    default:
      return (
        <BlockLayout
          blockStyle={skeleton.style}
          highlightBorders={lowdefy.lowdefyGlobal.highlightBorders}
          id={`s-bl-${blockId}-${skeleton.id}`}
          layout={layout}
          makeCssClass={makeCssClass}
        >
          <Component
            basePath={lowdefy.basePath}
            blockId={blockId}
            components={lowdefy._internal.components}
            key={`s-${blockId}-${skeleton.id}`}
            menus={lowdefy.menus}
            methods={{ makeCssClass }}
            pageId={lowdefy.pageId}
            properties={skeleton.properties}
            user={lowdefy.user}
          />
        </BlockLayout>
      );
  }
};

export default LoadingBlock;
