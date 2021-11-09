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
import { type } from '@lowdefy/helpers';
import { ErrorBoundary } from '@lowdefy/block-utils';
import { Area, BlockLayout, layoutParamsToArea } from '../src';

import Block from './blocks/Block';
import Box from './blocks/Box';
import Button from './blocks/Button';
import Input from './blocks/Input';
import Page from './blocks/Page';
import Paragraph from './blocks/Paragraph';
import List from './blocks/List';
import Markdown from './blocks/Markdown';

const Blocks = {
  Block,
  Button,
  Input,
  Paragraph,
  Markdown,
};
const Containers = {
  Box,
  Page,
};
const Lists = {
  List,
};

const randomId = () => Math.random().toString().slice(3, 8);

const Loading = ({ loading, children, showLoading = true }) =>
  loading && showLoading ? <span>Loading</span> : <>{children}</>;

const AutoBlock = ({ block, makeCssClass, highlightBorders }) => {
  const content = {};
  let areas;
  let Comp = Blocks[block.type];
  let category = 'block';
  if (!Comp) {
    Comp = Containers[block.type];
    category = 'container';
  }
  if (!Comp) {
    Comp = Lists[block.type];
    category = 'list';
  }

  switch (category) {
    case 'container':
      if (block.blocks) {
        areas = { content: { blocks: block.blocks } };
      }
      if (block.areas) {
        areas = block.areas;
      }
      Object.keys(areas || {}).forEach((areaKey) => {
        content[areaKey] = (areaStyle) => (
          <Area
            area={layoutParamsToArea({
              area: areas[areaKey] || {},
              areaKey,
              layout: block.layout || {},
            })}
            areaStyle={[areaStyle, type.isObject(areas[areaKey]) ? areas[areaKey].style : {}]}
            highlightBorders={highlightBorders}
            id={`${block.id}-${areaKey}` + randomId()}
            key={`${block.id}-${areaKey}`}
            makeCssClass={makeCssClass}
          >
            {(areas[areaKey].blocks || []).map((bl, i) => (
              <BindAutoBlock
                key={`${bl.id}-${i}`}
                block={bl}
                makeCssClass={makeCssClass}
                highlightBorders={highlightBorders}
              />
            ))}
          </Area>
        );
      });
      return (
        <Comp
          blockId={block.id + randomId()}
          content={content}
          loading={block.loading}
          makeCssClass={makeCssClass}
          properties={block.properties}
        />
      );
    default:
      return (
        <Comp
          blockId={block.id + randomId()}
          loading={block.loading}
          makeCssClass={makeCssClass}
          properties={block.properties}
        />
      );
  }
};

const BindAutoBlock = ({ block, state, makeCssClass, highlightBorders }) => {
  return (
    <ErrorBoundary>
      <Loading id={`${block.id}-loading`} loading={block.loading} showLoading>
        <BlockLayout
          id={`bl-${block.id}` + randomId()}
          highlightBorders={highlightBorders}
          layout={block.layout || {}}
          blockStyle={block.style}
          makeCssClass={makeCssClass}
        >
          <AutoBlock
            block={block}
            state={state}
            makeCssClass={makeCssClass}
            highlightBorders={highlightBorders}
          />
        </BlockLayout>
      </Loading>
    </ErrorBoundary>
  );
};

export default BindAutoBlock;
