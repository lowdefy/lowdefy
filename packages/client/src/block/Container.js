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

import React from 'react';
import { Area, BlockLayout } from '@lowdefy/layout';
import { cn } from '@lowdefy/block-utils';

import Block from './Block.js';
import resolveClassNames from './resolveClassNames.js';

const Container = ({ block, Blocks, Component, context, loading, lowdefy }) => {
  const classNames = resolveClassNames(block.eval.class);
  const content = {};
  // eslint-disable-next-line prefer-destructuring
  const slots = Blocks.subSlots[block.id][0].slots;
  Object.keys(slots).forEach((slotKey, i) => {
    content[slotKey] = (contentStyle) => (
      <Area
        area={block.eval.slots[slotKey]}
        areaKey={slotKey}
        style={{ ...block.eval.slots[slotKey]?.style, ...contentStyle }}
        className={cn(block.eval.class?.[slotKey])}
        id={`ar-${block.blockId}-${slotKey}`}
        key={`ar-${block.blockId}-${slotKey}-${i}`}
        layout={block.eval.layout}
      >
        {slots[slotKey].blocks.map((bl, k) => (
          <Block
            block={bl}
            Blocks={Blocks.subSlots[block.id][0]}
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
      style={block.eval.style?.block}
      className={classNames.block}
      id={`bl-${block.blockId}`}
      layout={block.eval.layout}
    >
      <Component
        methods={Object.assign(block.methods, {
          registerEvent: block.registerEvent,
          registerMethod: block.registerMethod,
          triggerEvent: block.triggerEvent,
        })}
        basePath={lowdefy.basePath}
        blockId={block.blockId}
        classNames={classNames}
        components={lowdefy._internal.components}
        content={content}
        events={block.eval.events ?? {}}
        key={block.blockId}
        loading={loading}
        menus={lowdefy.menus}
        pageId={lowdefy.pageId}
        properties={block.eval.properties}
        required={block.eval.required}
        styles={block.eval.style ?? {}}
        validation={block.eval.validation}
      />
    </BlockLayout>
  );
};

export default Container;
