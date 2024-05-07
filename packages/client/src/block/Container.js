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

import React from 'react';
import { Area, BlockLayout } from '@lowdefy/layout';
import { makeCssClass } from '@lowdefy/block-utils';

import Block from './Block.js';

const Container = ({ block, Blocks, Component, context, loading, lowdefy }) => {
  const content = {};
  // eslint-disable-next-line prefer-destructuring
  const areas = Blocks.subBlocks[block.id][0].areas;
  Object.keys(areas).forEach((areaKey, i) => {
    content[areaKey] = (areaStyle) => (
      <Area
        area={block.eval.areas[areaKey]}
        areaKey={areaKey}
        areaStyle={[areaStyle, block.eval.areas[areaKey]?.style]}
        id={`ar-${block.blockId}-${areaKey}`}
        key={`ar-${block.blockId}-${areaKey}-${i}`}
        layout={block.eval.layout}
        makeCssClass={makeCssClass}
      >
        {areas[areaKey].blocks.map((bl, k) => (
          <Block
            block={bl}
            Blocks={Blocks.subBlocks[block.id][0]}
            context={context}
            key={`co-${bl.blockId}-${k}`}
            lowdefy={lowdefy}
            parentLoading={loading}
          />
        ))}
      </Area>
    );
  });
  return (
    <BlockLayout
      blockStyle={block.eval.style}
      id={`bl-${block.blockId}`}
      layout={block.eval.layout}
      makeCssClass={makeCssClass}
    >
      <Component
        methods={Object.assign(block.methods, {
          makeCssClass,
          registerEvent: block.registerEvent,
          registerMethod: block.registerMethod,
          triggerEvent: block.triggerEvent,
        })}
        basePath={lowdefy.basePath}
        blockId={block.blockId}
        components={lowdefy._internal.components}
        content={content}
        events={block.eval.events}
        key={block.blockId}
        loading={loading}
        menus={lowdefy.menus}
        pageId={lowdefy.pageId}
        properties={block.eval.properties}
        required={block.eval.required}
        validation={block.eval.validation}
      />
    </BlockLayout>
  );
};

export default Container;
