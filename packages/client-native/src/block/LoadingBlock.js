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
import { type } from '@lowdefy/helpers';

import Area from './Area.js';
import BlockLayout from './BlockLayout.js';
import getSkeletonBlock from './getSkeletonBlock.js';
import loadingBlockMethods from './loadingBlockMethods.js';
import useBlockStyles from '../style/useBlockStyles.js';

const getSkeletonLayout = (skeleton) => skeleton.layout;

// The skeleton a loading block shows in its place. A skeleton with slots is drawn as a container
// of skeletons. The build checks skeleton types, so the component is always in the type map.
// The skeleton's style is split into slots as a block's is (getSkeletonBlock): its block slot
// styles the view it is placed in, and its block gets the rest (`.element`), so a Skeleton
// skeleton takes its element padding as a Skeleton block does. A skeleton without a style is
// placed with the loading block's own block style, as on the web.
const LoadingBlock = ({ blockId, blockLayout, blockProperties, blockStyle, lowdefy, skeleton }) => {
  const Component = lowdefy._internal.blockComponents[skeleton.type];
  const styles = useBlockStyles({
    block: getSkeletonBlock({ blockId, skeleton }),
    lowdefy,
    unconverted: true,
  });
  const content = {};
  Object.keys(skeleton.slots ?? {}).forEach((slotKey) => {
    content[slotKey] = () => (
      <Area
        area={skeleton.slots[slotKey]}
        areaKey={slotKey}
        blocks={skeleton.slots[slotKey].blocks}
        getLayout={getSkeletonLayout}
        key={`s-ar-${blockId}-${skeleton.id}-${slotKey}`}
        layout={skeleton.layout ?? blockLayout}
        renderBlock={(skl, k) => (
          <LoadingBlock
            blockId={blockId}
            key={`s-co-${skl.id}-${k}`}
            lowdefy={lowdefy}
            skeleton={skl}
          />
        )}
        style={skeleton.slots[slotKey]?.style}
      />
    );
  });
  return (
    <BlockLayout
      blockId={`s-${blockId}-${skeleton.id}`}
      layout={skeleton.layout ?? blockLayout}
      style={type.isNone(skeleton.style) ? blockStyle : styles.block}
    >
      <Component
        basePath={lowdefy.basePath}
        blockId={blockId}
        components={lowdefy._internal.components}
        content={content}
        events={{}}
        loading={true}
        menus={lowdefy.menus}
        methods={{
          ...loadingBlockMethods,
          getAppStorageKey: lowdefy._internal.storage.appKey,
          getUserStorageKey: lowdefy._internal.storage.userKey,
        }}
        pageId={lowdefy.pageId}
        properties={skeleton.properties ?? blockProperties}
        styles={styles}
      />
    </BlockLayout>
  );
};

export default LoadingBlock;
