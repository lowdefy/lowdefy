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

import React from 'react';
import { Area, BlockLayout, layoutParamsToArea } from '@lowdefy/layout';
import { makeCssClass } from '@lowdefy/block-tools';

import Block from './Block';

const Container = ({ block, Blocks, Component, context, pageId, rootContext }) => {
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
        highlightBorders={rootContext.lowdefyGlobal.highlightBorders}
        makeCssClass={makeCssClass}
      >
        {areas[areaKey].blocks.map((bl) => (
          <Block
            key={`co-${bl.blockId}`}
            Blocks={Blocks.subBlocks[block.id][0]}
            block={bl}
            context={context}
            pageId={pageId}
            rootContext={rootContext}
          />
        ))}
      </Area>
    );
  });
  return (
    <BlockLayout
      id={`bl-${block.blockId}`}
      blockStyle={block.eval.style}
      highlightBorders={rootContext.lowdefyGlobal.highlightBorders}
      layout={block.eval.layout || {}}
      makeCssClass={makeCssClass}
    >
      <Component
        methods={{
          callAction: block.callAction,
          makeCssClass,
          registerAction: block.registerAction,
          registerMethod: block.registerMethod,
        }}
        actions={block.eval.actions}
        blockId={block.blockId}
        content={content}
        homePageId={rootContext.homePageId}
        key={block.blockId}
        loading={block.loading}
        menus={rootContext.menus}
        pageId={pageId}
        properties={block.eval.properties}
        required={block.eval.required}
        user={rootContext.user}
        validation={block.eval.validation}
      />
    </BlockLayout>
  );
};

export default Container;
