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
import { Area, BlockLayout } from '../../index.js';

import Block from './Block.js';
import Box from './Box.js';
import Button from './Button.js';
import Input from './Input.js';
import List from './List.js';
import Paragraph from './Paragraph.js';

const Blocks = {
  Block,
  Button,
  Input,
  Paragraph,
};
const Containers = {
  Box,
};
const Lists = {
  List,
};

const randomId = () => Math.random().toString().slice(3, 8);

const Loading = ({ loading, children, showLoading = true }) =>
  loading && showLoading ? <span>Loading</span> : <>{children}</>;

const AutoBlock = ({ block }) => {
  const content = {};
  let slots;
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
        slots = { content: { blocks: block.blocks } };
      }
      if (block.slots) {
        slots = block.slots;
      }
      Object.keys(slots || {}).forEach((slotKey) => {
        content[slotKey] = () => (
          <Area
            area={slots[slotKey]}
            areaKey={slotKey}
            id={`${block.id}-${slotKey}${randomId()}`}
            key={`${block.id}-${slotKey}`}
            layout={block.layout}
            style={slots[slotKey]?.style}
          >
            {(slots[slotKey].blocks || []).map((bl, i) => (
              <BindAutoBlock key={`${bl.id}-${i}`} block={bl} />
            ))}
          </Area>
        );
      });
      return (
        <Comp
          blockId={`${block.id}${randomId()}`}
          content={content}
          properties={block.properties}
        />
      );
    default:
      return (
        <Comp
          blockId={`${block.id}${randomId()}`}
          properties={block.properties}
        />
      );
  }
};

const BindAutoBlock = ({ block, state }) => {
  return (
    <Loading id={`${block.id}-loading`} showLoading>
      <BlockLayout
        id={`bl-${block.id}${randomId()}`}
        layout={block.layout}
        style={block.style}
      >
        <AutoBlock block={block} state={state} />
      </BlockLayout>
    </Loading>
  );
};

export default BindAutoBlock;
