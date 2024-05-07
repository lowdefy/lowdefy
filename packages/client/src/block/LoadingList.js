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

import LoadingBlock from './LoadingBlock.js';

const LoadingList = ({
  blockId,
  blockLayout,
  blockProperties,
  blockStyle,
  Component,
  context,
  lowdefy,
  skeleton,
}) => {
  const content = {};
  const contentList = [];
  new Array(3).forEach(() => {
    Object.keys(skeleton.areas).forEach((areaKey, i) => {
      content[areaKey] = (areaStyle) => (
        <Area
          area={skeleton.areas[areaKey]}
          areaKey={areaKey}
          areaStyle={[areaStyle, skeleton.areas[areaKey]?.style]}
          id={`s-ar-${blockId}-${skeleton.id}-${areaKey}`}
          key={`s-ar-${blockId}-${skeleton.id}-${areaKey}-${i}`}
          layout={skeleton.layout ?? blockLayout}
          makeCssClass={makeCssClass}
        >
          {skeleton.areas[areaKey].blocks.map((skl, k) => (
            <LoadingBlock
              blockId={blockId}
              context={context}
              key={`s-co-${skl.id}-${k}`}
              lowdefy={lowdefy}
              skeleton={skl}
            />
          ))}
        </Area>
      );
    });
    contentList.push({ ...content });
  });
  return (
    <BlockLayout
      blockStyle={skeleton.style ?? blockStyle}
      id={`s-bl-${blockId}-${skeleton.id}`}
      layout={skeleton.layout ?? blockLayout}
      makeCssClass={makeCssClass}
    >
      <Component
        basePath={lowdefy.basePath}
        blockId={blockId}
        components={lowdefy._internal.components}
        list={contentList}
        menus={lowdefy.menus}
        methods={{ makeCssClass }}
        pageId={lowdefy.pageId}
        properties={skeleton.properties ?? blockProperties}
      />
    </BlockLayout>
  );
};

export default LoadingList;
