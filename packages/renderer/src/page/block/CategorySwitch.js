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
import { BlockLayout } from '@lowdefy/layout';
import { makeContextId } from '@lowdefy/engine';
import { makeCssClass } from '@lowdefy/block-tools';

import Container from './Container';
import Context from './Context';
import List from './List';

const CategorySwitch = ({ block, Blocks, Component, context, pageId, rootContext }) => {
  switch (block.meta.category) {
    case 'context':
      return (
        <Context
          block={block}
          context={context}
          contextId={makeContextId({
            // TODO: remove branch
            branch: 'main',
            urlQuery: rootContext.urlQuery,
            pageId,
            blockId: block.blockId,
          })}
          pageId={pageId}
          rootContext={rootContext}
          render={(context) => (
            <Container
              block={context.RootBlocks.areas.root.blocks[0]}
              Blocks={context.RootBlocks}
              Component={Component}
              context={context}
              pageId={pageId}
              rootContext={rootContext}
            />
          )}
        />
      );
    case 'list':
      return (
        <List
          block={block}
          Blocks={Blocks}
          Component={Component}
          context={context}
          pageId={pageId}
          rootContext={rootContext}
        />
      );
    case 'container':
      return (
        <Container
          block={block}
          Blocks={Blocks}
          Component={Component}
          context={context}
          pageId={pageId}
          rootContext={rootContext}
        />
      );
    case 'input':
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
              setValue: block.setValue,
            }}
            actions={block.eval.actions}
            blockId={block.blockId}
            Components={rootContext.Components}
            homePageId={rootContext.homePageId}
            key={block.blockId}
            loading={block.loading}
            menus={rootContext.menus}
            pageId={pageId}
            properties={block.eval.properties}
            required={block.eval.required}
            user={rootContext.user}
            validate={block.eval.validate}
            value={block.value}
          />
        </BlockLayout>
      );
    default:
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
            Components={rootContext.Components}
            homePageId={rootContext.homePageId}
            key={block.blockId}
            loading={block.loading}
            menus={rootContext.menus}
            pageId={pageId}
            properties={block.eval.properties}
            required={block.eval.required}
            user={rootContext.user}
            validate={block.eval.validate}
          />
        </BlockLayout>
      );
  }
};

export default CategorySwitch;
