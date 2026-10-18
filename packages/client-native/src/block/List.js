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
import { get } from '@lowdefy/helpers';

import Area from './Area.js';
import Block from './Block.js';
import BlockLayout from './BlockLayout.js';
import getBlockProps from './getBlockProps.js';
import useBlockStyles from '../style/useBlockStyles.js';

const getEvaluatedLayout = (block) => block.eval?.layout;

// A list block: one set of slot functions per item, passed as `list`.
const List = ({ block, Blocks, category, Component, context, loading, lowdefy }) => {
  const styles = useBlockStyles({ block, lowdefy });
  const list = Blocks.subSlots[block.id].map((SBlock) => {
    const content = {};
    Object.keys(SBlock.slots).forEach((slotKey) => {
      if (SBlock.slots[slotKey].blocks.length === 0) return;
      content[slotKey] = (contentStyle) => (
        <Area
          area={block.eval.slots?.[slotKey]}
          areaKey={slotKey}
          blocks={SBlock.slots[slotKey].blocks}
          getLayout={getEvaluatedLayout}
          key={`ar-${block.blockId}-${SBlock.id}-${slotKey}`}
          layout={block.eval.layout}
          renderBlock={(bl) => (
            <Block
              block={bl}
              Blocks={SBlock}
              context={context}
              key={`ls-${bl.blockId}`}
              lowdefy={lowdefy}
              parentLoading={loading}
            />
          )}
          style={[block.eval.slots?.[slotKey]?.style, contentStyle]}
        />
      );
    });
    return content;
  });
  return (
    <BlockLayout blockId={block.blockId} layout={block.eval.layout} style={styles.block}>
      <Component
        {...getBlockProps({ block, category, context, loading, lowdefy, styles })}
        list={list}
        value={get(context.state, block.blockId) ?? []}
      />
    </BlockLayout>
  );
};

export default List;
