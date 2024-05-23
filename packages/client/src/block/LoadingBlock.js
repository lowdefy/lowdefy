/*
  Copyright 2020-2024 Lowdefy, Inc

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
import React, { useEffect } from 'react';
import { BlockLayout } from '@lowdefy/layout';
import { makeCssClass } from '@lowdefy/block-utils';

import LoadingContainer from './LoadingContainer.js';
import LoadingList from './LoadingList.js';

const blockMethods = {
  makeCssClass,
  moveItemDown: () => {},
  moveItemUp: () => {},
  pushItem: () => {},
  registerEvent: () => {},
  registerMethod: () => {},
  removeItem: () => {},
  setValue: () => {},
  triggerEvent: () => {},
  unshiftItem: () => {},
};

const LoadingBlock = ({
  blockId,
  blockLayout,
  blockProperties,
  blockStyle,
  context,
  lowdefy,
  skeleton,
}) => {
  let Component = lowdefy._internal.blockComponents[skeleton.type];
  useEffect(() => {
    if (!lowdefy._internal.blockComponents[skeleton.type]) {
      console.warn(
        `Skeleton block type not found for ${skeleton.type} in ${blockId}. Only '@lowdefy/blocks-basic' and '@lowdefy/blocks-loaders' block types are supported for skeletons.`
      );
    }
    return;
  }, []);
  if (!Component) {
    // default to box when a skeleton block is not found - should be a basic or loader block.
    Component = lowdefy._internal.blockComponents.Box;
  }

  switch (Component.meta.category) {
    case 'list':
      return (
        <LoadingList
          blockId={blockId}
          Component={Component}
          context={context}
          lowdefy={lowdefy}
          skeleton={skeleton}
        />
      );
    case 'container':
      return (
        <LoadingContainer
          blockId={blockId}
          blockLayout={blockLayout}
          blockProperties={blockProperties}
          blockStyle={blockStyle}
          Component={Component}
          context={context}
          lowdefy={lowdefy}
          skeleton={skeleton}
        />
      );
    default:
      return (
        <BlockLayout
          blockStyle={skeleton.style ?? blockStyle}
          id={`s-bl-${blockId}-${skeleton.id}`}
          layout={skeleton.layout ?? blockLayout}
          makeCssClass={makeCssClass}
        >
          <Component
            basePath={lowdefy.basePath}
            blockId={blockId}
            components={lowdefy._internal.components}
            key={`s-${blockId}-${skeleton.id}`}
            menus={lowdefy.menus}
            methods={blockMethods}
            pageId={lowdefy.pageId}
            properties={skeleton.properties ?? blockProperties}
          />
        </BlockLayout>
      );
  }
};

export default LoadingBlock;
