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

import React, { useRef } from 'react';
import { type } from '@lowdefy/helpers';

import Container from './Container.js';
import Display from './Display.js';
import List from './List.js';
import LoadingBlock from './LoadingBlock.js';

// Renders a block as its category asks, once the engine has evaluated it. A block evaluated
// visible: false is not drawn at all. A loading block with a skeleton draws the skeleton in its
// place; when it stops loading, its content fades in over the skeleton's place (fadeIn), so a
// screen settles rather than jumps as its data arrives.
const CategorySwitch = ({ block, Blocks, context, loading, lowdefy }) => {
  const showedSkeleton = useRef(false);
  // A list item's blocks can render before their first evaluation (see the web renderer, #520).
  if (!block.eval) return null;
  if (block.eval.visible === false) return null;
  if (loading && type.isObject(block.eval.skeleton)) {
    showedSkeleton.current = true;
    return (
      <LoadingBlock
        blockId={block.blockId}
        blockLayout={block.eval.layout}
        blockProperties={block.eval.properties}
        blockStyle={block.eval.style?.block}
        lowdefy={lowdefy}
        skeleton={block.eval.skeleton}
      />
    );
  }
  const Component = lowdefy._internal.blockComponents[block.type];
  const category = lowdefy._internal.blockMetas[block.type]?.category;
  const props = {
    block,
    Blocks,
    category,
    Component,
    context,
    fadeIn: showedSkeleton.current,
    loading,
    lowdefy,
  };
  switch (category) {
    case 'list':
      return <List {...props} />;
    case 'container':
    case 'input-container':
      return <Container {...props} />;
    default:
      return <Display {...props} />;
  }
};

export default CategorySwitch;
