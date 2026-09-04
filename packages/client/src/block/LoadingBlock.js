/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { type } from '@lowdefy/helpers';
import LoadingContainer from './LoadingContainer.js';
import LoadingList from './LoadingList.js';
import resolveClassNames from './resolveClassNames.js';
import withBlockLayout from './withBlockLayout.js';

const blockMethods = {
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
  blockClass,
  blockId,
  blockLayout,
  blockProperties,
  blockStyle,
  context,
  inArea,
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

  // The skeleton stands in for the block, so it carries the block's class and
  // style on its own root the same way the block does - the wrapper carries only
  // layout, and is skipped on exactly the same rule.
  const classNames = type.isNone(skeleton.class) ? blockClass : resolveClassNames(skeleton.class);
  const styles = { block: skeleton.style ?? blockStyle };
  const layout = skeleton.layout ?? blockLayout;

  const resolvedType = Component === lowdefy._internal.blockComponents.Box ? 'Box' : skeleton.type;
  const category = lowdefy._internal.blockMetas[resolvedType]?.category;
  switch (category) {
    case 'list':
      return (
        <LoadingList
          blockClass={blockClass}
          blockId={blockId}
          blockLayout={blockLayout}
          blockProperties={blockProperties}
          blockStyle={blockStyle}
          Component={Component}
          context={context}
          inArea={inArea}
          lowdefy={lowdefy}
          skeleton={skeleton}
        />
      );
    case 'container':
      return (
        <LoadingContainer
          blockClass={blockClass}
          blockId={blockId}
          blockLayout={blockLayout}
          blockProperties={blockProperties}
          blockStyle={blockStyle}
          Component={Component}
          context={context}
          inArea={inArea}
          lowdefy={lowdefy}
          skeleton={skeleton}
        />
      );
    default:
      return withBlockLayout(
        { id: `s-bl-${blockId}-${skeleton.id}`, inArea, layout },
        <Component
          basePath={lowdefy.basePath}
          blockId={blockId}
          classNames={classNames}
          components={lowdefy._internal.components}
          key={`s-${blockId}-${skeleton.id}`}
          menus={lowdefy.menus}
          methods={blockMethods}
          pageId={lowdefy.pageId}
          properties={skeleton.properties ?? blockProperties}
          styles={styles}
        />
      );
  }
};

export default LoadingBlock;
