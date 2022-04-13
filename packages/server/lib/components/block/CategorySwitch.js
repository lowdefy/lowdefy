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
import { type } from '@lowdefy/helpers';

import Container from './Container.js';
import List from './List.js';
import LoadingBlock from './LoadingBlock.js';

const CategorySwitch = ({ block, Blocks, context, loading, lowdefy }) => {
  if (!block.eval) return null; // TODO: check Renderer updates before eval is executed for the first time on lists. See #520
  if (block.eval.visible === false)
    return <div id={`vs-${block.blockId}`} style={{ display: 'none' }} />;
  let Component = lowdefy._internal.blockComponents[block.type];
  // block skeleton:
  // undefined, null, true - Try render component skeleton
  // object - Render skeleton
  // false - Render component
  if (loading && block.eval.skeleton !== false && !type.isNone(block.eval.skeleton)) {
    if (!type.isObject(block.eval.skeleton) && block.eval.skeleton !== true) {
      throw new Error(
        `Config Error: Invalid skeleton definition at block id ${block.blockId}. Skeleton config must be a boolean or an object.`
      );
    }
    return (
      <LoadingBlock
        blockLayout={block.eval.layout}
        context={context}
        lowdefy={lowdefy}
        skeleton={block.eval.skeleton}
      />
    );
  }
  // component skeleton:
  // false - Render component
  // object - Render component skeleton
  if (loading && Component.meta.skeleton !== false && !type.isNone(Component.meta.skeleton)) {
    if (!type.isObject(Component.meta.skeleton) && Component.meta.skeleton !== true) {
      throw new Error(`Block Error: Block type ${block.type} has an invalid skeleton definition.`);
    }
    return (
      <LoadingBlock
        skeleton={Component.meta.skeleton}
        context={context}
        lowdefy={lowdefy}
        layout={block.eval.layout || {}}
      />
    );
  }

  switch (Component.meta.category) {
    case 'list':
      return (
        <List
          block={block}
          Blocks={Blocks}
          Component={Component}
          context={context}
          loading={loading}
          lowdefy={lowdefy}
        />
      );
    case 'container':
      return (
        <Container
          block={block}
          Blocks={Blocks}
          Component={Component}
          context={context}
          loading={loading}
          lowdefy={lowdefy}
        />
      );
    case 'input':
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
              setValue: block.setValue,
              triggerEvent: block.triggerEvent,
            })}
            basePath={lowdefy.basePath}
            blockId={block.blockId}
            components={lowdefy._internal.components}
            events={block.eval.events}
            key={block.blockId}
            loading={loading}
            menus={lowdefy.menus}
            pageId={lowdefy.pageId}
            properties={block.eval.properties}
            required={block.eval.required}
            user={lowdefy.user}
            validation={block.eval.validation}
            value={block.value}
          />
        </BlockLayout>
      );
    default:
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
            basePath={lowdefy.basePath}
            blockId={block.blockId}
            components={lowdefy._internal.components}
            events={block.eval.events}
            key={block.blockId}
            loading={loading}
            menus={lowdefy.menus}
            pageId={lowdefy.pageId}
            properties={block.eval.properties}
            required={block.eval.required}
            user={lowdefy.user}
            validation={block.eval.validation}
          />
        </BlockLayout>
      );
  }
};

export default CategorySwitch;
