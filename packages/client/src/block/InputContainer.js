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
import { Area, areaIsRendered } from '@lowdefy/layout';
import { cn } from '@lowdefy/block-utils';

import Block from './Block.js';
import createBlockMethods from './createBlockMethods.js';
import resolveClassNames from './resolveClassNames.js';
import withBlockLayout from './withBlockLayout.js';

const InputContainer = ({ block, Blocks, Component, context, inArea, loading, lowdefy }) => {
  const classNames = resolveClassNames(block.eval.class);
  const content = {};
  // eslint-disable-next-line prefer-destructuring
  const slots = Blocks.subSlots[block.id][0].slots;
  Object.keys(slots).forEach((slotKey, i) => {
    if (slots[slotKey].blocks.length === 0) return;
    content[slotKey] = (contentStyle) => {
      const style = { ...block.eval.slots[slotKey]?.style, ...contentStyle };
      const className = cn(block.eval.class?.[slotKey]);
      const renderArea = areaIsRendered({
        area: block.eval.slots[slotKey],
        areaKey: slotKey,
        blockLayouts: slots[slotKey].blocks.map((bl) => bl.eval?.layout),
        className,
        layout: block.eval.layout,
        style,
      });
      const children = slots[slotKey].blocks.map((bl, k) => (
        <Block
          block={bl}
          Blocks={Blocks.subSlots[block.id][0]}
          context={context}
          inArea={renderArea}
          key={`co-${bl.blockId}-${k}`}
          lowdefy={lowdefy}
          parentLoading={loading}
        />
      ));
      if (!renderArea) {
        return (
          <React.Fragment key={`co-${block.blockId}-${slotKey}-${i}`}>{children}</React.Fragment>
        );
      }
      return (
        <Area
          area={block.eval.slots[slotKey]}
          areaKey={slotKey}
          style={style}
          className={className}
          id={`ar-${block.blockId}-${slotKey}`}
          key={`ar-${block.blockId}-${slotKey}-${i}`}
          layout={block.eval.layout}
        >
          {children}
        </Area>
      );
    };
  });
  return withBlockLayout(
    { id: `bl-${block.blockId}`, inArea, layout: block.eval.layout },
    <Component
      methods={createBlockMethods({
        blockId: block.blockId,
        blockType: block.type,
        configKey: block.eval?.configKey,
        methods: Object.assign(block.methods, {
          getLocale: () => lowdefy.i18n?.active ?? lowdefy.i18n?.defaultLocale,
          registerEvent: block.registerEvent,
          registerMethod: block.registerMethod,
          translate: lowdefy._internal.translate,
          triggerEvent: block.triggerEvent,
          setValue: block.setValue,
          moveItemDown: block.moveItemDown,
          moveItemUp: block.moveItemUp,
          pushItem: block.pushItem,
          removeItem: block.removeItem,
          unshiftItem: block.unshiftItem,
        }),
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
      value={block.value}
    />
  );
};

export default InputContainer;
