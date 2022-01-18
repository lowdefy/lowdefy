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
import { Area, BlockLayout, layoutParamsToArea } from '@lowdefy/layout';
import { makeCssClass } from '@lowdefy/block-utils';

import Block from './Block.js';

const Container = ({ block, Blocks, Component, context, lowdefy }) => {
  const content = {};
  // eslint-disable-next-line prefer-destructuring
  const areas = Blocks.subBlocks[block.id][0].areas;
  Object.keys(areas).forEach((areaKey) => {
    content[areaKey] = (areaStyle) => (
      <Area
        id={`ar-${block.blockId}-${areaKey}`}
        key={`ar-${block.blockId}-${areaKey}`}
        area={layoutParamsToArea({
          area: block.eval.areas[areaKey] || {},
          areaKey,
          layout: block.eval.layout || {},
        })}
        areaStyle={[areaStyle, block.eval.areas[areaKey] && block.eval.areas[areaKey].style]}
        highlightBorders={lowdefy.lowdefyGlobal.highlightBorders}
        makeCssClass={makeCssClass}
      >
        {areas[areaKey].blocks.map((bl) => (
          <Block
            key={`co-${bl.blockId}`}
            Blocks={Blocks.subBlocks[block.id][0]}
            block={bl}
            context={context}
            lowdefy={lowdefy}
          />
        ))}
      </Area>
    );
  });
  return (
    <BlockLayout
      id={`bl-${block.blockId}`}
      blockStyle={block.eval.style}
      highlightBorders={lowdefy.lowdefyGlobal.highlightBorders}
      layout={block.eval.layout || {}}
      makeCssClass={makeCssClass}
    >
      <Component
        methods={Object.assign(block.methods, {
          makeCssClass,
          registerEvent: block.registerEvent,
          registerMethod: block.registerMethod,
          triggerEvent: block.triggerEvent,
        })}
        basePath={lowdefy._internal.basePath}
        blockId={block.blockId}
        components={lowdefy._internal.components}
        content={content}
        events={block.eval.events}
        homePageId={lowdefy.home.pageId}
        key={block.blockId}
        loading={block.loading}
        menus={lowdefy.menus}
        pageId={lowdefy.pageId}
        properties={block.eval.properties}
        required={block.eval.required}
        user={lowdefy.user}
        validation={block.eval.validation}
      />
    </BlockLayout>
  );
};

export default Container;
