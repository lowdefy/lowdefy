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
import { BlockLayout } from '@lowdefy/layout';
import { makeCssClass } from '@lowdefy/block-utils';

import Container from './Container.js';
import List from './List.js';

const CategorySwitch = ({ block, Blocks, context, lowdefy }) => {
  if (!block.eval) return null; // Renderer updates before eval is executed for the first time on lists. See #520
  if (block.eval.visible === false)
    return <div id={`vs-${block.blockId}`} style={{ display: 'none' }} />;
  const Component = lowdefy._internal.blockComponents[block.type];
  switch (Component.meta.category) {
    case 'list':
      return (
        <List
          block={block}
          Blocks={Blocks}
          Component={Component}
          context={context}
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
            // TODO: React throws a  basePath warning
            basePath={lowdefy._internal.basePath}
            blockId={block.blockId}
            components={lowdefy._internal.components}
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
            basePath={lowdefy._internal.basePath}
            blockId={block.blockId}
            components={lowdefy._internal.components}
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
  }
};

export default CategorySwitch;
