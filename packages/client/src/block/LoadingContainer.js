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
import { type } from '@lowdefy/helpers';

import LoadingBlock from './LoadingBlock.js';
import resolveClassNames from './resolveClassNames.js';
import withBlockLayout from './withBlockLayout.js';

const LoadingContainer = ({
  blockClass,
  blockId,
  blockLayout,
  blockProperties,
  blockStyle,
  Component,
  context,
  inArea,
  lowdefy,
  skeleton,
}) => {
  const classNames = type.isNone(skeleton.class) ? blockClass : resolveClassNames(skeleton.class);
  const styles = { block: skeleton.style ?? blockStyle };
  const layout = skeleton.layout ?? blockLayout;
  const content = {};
  Object.keys(skeleton.slots).forEach((slotKey, i) => {
    content[slotKey] = (contentStyle) => {
      const style = { ...skeleton.slots[slotKey]?.style, ...contentStyle };
      const renderArea = areaIsRendered({
        area: skeleton.slots[slotKey],
        areaKey: slotKey,
        blockLayouts: skeleton.slots[slotKey].blocks.map((skl) => skl.layout),
        layout,
        style,
      });
      const children = skeleton.slots[slotKey].blocks.map((skl, k) => (
        <LoadingBlock
          blockId={blockId}
          context={context}
          inArea={renderArea}
          key={`s-co-${skl.id}-${k}`}
          lowdefy={lowdefy}
          skeleton={skl}
        />
      ));
      if (!renderArea) {
        return (
          <React.Fragment key={`s-co-${blockId}-${skeleton.id}-${slotKey}-${i}`}>
            {children}
          </React.Fragment>
        );
      }
      return (
        <Area
          area={skeleton.slots[slotKey]}
          areaKey={slotKey}
          style={style}
          id={`s-ar-${blockId}-${skeleton.id}-${slotKey}`}
          key={`s-ar-${blockId}-${skeleton.id}-${slotKey}-${i}`}
          layout={layout}
        >
          {children}
        </Area>
      );
    };
  });
  return withBlockLayout(
    { id: `s-bl-${blockId}-${skeleton.id}`, inArea, layout },
    <Component
      basePath={lowdefy.basePath}
      blockId={blockId}
      classNames={classNames}
      components={lowdefy._internal.components}
      content={content}
      key={skeleton.id}
      menus={lowdefy.menus}
      methods={{}}
      pageId={lowdefy.pageId}
      properties={skeleton.properties ?? blockProperties}
      styles={styles}
    />
  );
};

export default LoadingContainer;
