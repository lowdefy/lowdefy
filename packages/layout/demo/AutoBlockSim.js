import React from 'react';
import type from '@lowdefy/type';
import { Input } from 'antd';
import { Area, BlockLayout, layoutParamsToArea } from '../src';

import Block from './blocks/Block';
import Box from './blocks/Box';
import Button from './blocks/Button';
import Page from './blocks/Page';
import Paragraph from './blocks/Paragraph';
import List from './blocks/List';
import Markdown from './blocks/Markdown';
import ErrorBoundary from './ErrorBoundary';

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

const Loading = ({ loading, children, showLoading = true }) =>
  loading && showLoading ? <span>Loading</span> : <>{children}</>;

const AutoBlock = ({ block, makeCss, highlightBorders }) => {
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
            id={`${block.id}-${areaKey}`}
            key={`${block.id}-${areaKey}`}
            makeCss={makeCss}
          >
            {(areas[areaKey].blocks || []).map((bl, i) => (
              <BindAutoBlock
                key={`${bl.id}-${i}`}
                block={bl}
                makeCss={makeCss}
                highlightBorders={highlightBorders}
              />
            ))}
          </Area>
        );
      });
      return (
        <Comp
          blockId={block.id}
          content={content}
          loading={block.loading}
          makeCss={makeCss}
          properties={block.properties}
        />
      );
    default:
      return (
        <Comp
          blockId={block.id}
          loading={block.loading}
          makeCss={makeCss}
          properties={block.properties}
        />
      );
  }
};

const BindAutoBlock = ({ block, state, makeCss, highlightBorders }) => {
  return (
    <ErrorBoundary>
      <Loading id={`${block.id}-loading`} loading={block.loading} showLoading>
        <BlockLayout
          id={`bl-${block.id}`}
          highlightBorders={highlightBorders}
          layout={block.layout || {}}
          blockStyle={block.style}
          makeCss={makeCss}
        >
          <AutoBlock
            block={block}
            state={state}
            makeCss={makeCss}
            highlightBorders={highlightBorders}
          />
        </BlockLayout>
      </Loading>
    </ErrorBoundary>
  );
};

export default BindAutoBlock;
