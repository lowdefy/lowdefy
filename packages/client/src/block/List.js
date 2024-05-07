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

const List = ({ block, Blocks, Component, context, loading, lowdefy }) => {
  const content = {};
  const contentList = [];
  Blocks.subBlocks[block.id].forEach((SBlock) => {
    Object.keys(SBlock.areas).forEach((areaKey) => {
      content[areaKey] = (areaStyle) => (
        <Area
          area={block.eval.areas[areaKey]}
          areaKey={areaKey}
          areaStyle={[areaStyle, block.eval.areas[areaKey]?.style]}
          id={`ar-${block.blockId}-${SBlock.id}-${areaKey}`}
          key={`ar-${block.blockId}-${SBlock.id}-${areaKey}`}
          layout={block.eval.layout}
          makeCssClass={makeCssClass}
        >
          {SBlock.areas[areaKey].blocks.map((bl) => (
            <Block
              block={bl}
              Blocks={SBlock}
              context={context}
              key={`ls-${bl.blockId}`}
              lowdefy={lowdefy}
              parentLoading={loading}
            />
          ))}
        </Area>
      );
    });
    contentList.push({ ...content });
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
          moveItemDown: block.moveItemDown,
          moveItemUp: block.moveItemUp,
          pushItem: block.pushItem,
          registerEvent: block.registerEvent,
          registerMethod: block.registerMethod,
          removeItem: block.removeItem,
          triggerEvent: block.triggerEvent,
          unshiftItem: block.unshiftItem,
        })}
        basePath={lowdefy.basePath}
        blockId={block.blockId}
        components={lowdefy._internal.components}
        events={block.eval.events}
        key={block.blockId}
        list={contentList}
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

export default List;
