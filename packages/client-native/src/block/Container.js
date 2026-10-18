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

import Area from './Area.js';
import Block from './Block.js';
import BlockLayout from './BlockLayout.js';
import getBlockProps from './getBlockProps.js';
import useBlockStyles from '../style/useBlockStyles.js';
import useVisibleSlots from './useVisibleSlots.js';

const getEvaluatedLayout = (block) => block.eval?.layout;

// A container or input container: its slots are passed as `content`, a function per slot that
// renders the slot's blocks in an area. A slot with no visible block has no function, so the
// block draws nothing for it (useVisibleSlots). A block may pass the loading its slot's blocks
// inherit (`{ loading }`), for slots that are its chrome rather than its content.
const Container = ({ block, Blocks, category, Component, context, loading, lowdefy }) => {
  const styles = useBlockStyles({ block, lowdefy });
  const content = {};
  const { slots } = Blocks.subSlots[block.id][0];
  const visibleSlots = useVisibleSlots({ context, slots });
  Object.keys(slots).forEach((slotKey) => {
    if (!visibleSlots.has(slotKey)) return;
    content[slotKey] = (contentStyle, { loading: slotLoading = loading } = {}) => (
      <Area
        area={block.eval.slots?.[slotKey]}
        areaKey={slotKey}
        blocks={slots[slotKey].blocks}
        getLayout={getEvaluatedLayout}
        key={`ar-${block.blockId}-${slotKey}`}
        layout={block.eval.layout}
        renderBlock={(bl, k) => (
          <Block
            block={bl}
            Blocks={Blocks.subSlots[block.id][0]}
            context={context}
            key={`co-${bl.blockId}-${k}`}
            lowdefy={lowdefy}
            parentLoading={slotLoading}
          />
        )}
        style={[block.eval.slots?.[slotKey]?.style, contentStyle]}
      />
    );
  });
  return (
    <BlockLayout blockId={block.blockId} layout={block.eval.layout} style={styles.block}>
      <Component
        {...getBlockProps({ block, category, context, loading, lowdefy, styles })}
        content={content}
        value={category === 'input-container' ? block.value : undefined}
      />
    </BlockLayout>
  );
};

export default Container;
