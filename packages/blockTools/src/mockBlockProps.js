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

import React, { useState } from 'react';
import { type } from '@lowdefy/helpers';

const mockBlockProps = (exBlock, meta) => {
  const [value, setState] = useState(type.enforceType(meta.valueType, null));
  const setValue = (val) => {
    setState(type.enforceType(meta.valueType, val));
  };

  const block = JSON.parse(JSON.stringify(exBlock));
  block.blockId = block.id;
  if (meta.category === 'list' || meta.category === 'container' || meta.category === 'context') {
    if (!block.areas) block.areas = {};
    if (block.blocks) block.areas.content = block.blocks;
  }
  if (!block.methods) block.methods = {};
  block.methods = {
    ...block.methods,
    callAction: (action) => alert(JSON.stringify(action, null, 2)),
    registerAction: (action) => alert(JSON.stringify(action, null, 2)),
    registerMethod: (method) => alert(JSON.stringify(method, null, 2)),
  };

  if (meta.category === 'list') {
    block.list = [];
    (block.areas.content || []).forEach((bl) => {
      block.list.push({
        content: () => (
          <div key={bl.id} style={{ border: '1px solid red', padding: 10 }}>
            {bl.id}
          </div>
        ),
      });
    });
    block.methods = {
      ...block.methods,
      pushItem: () => alert('List pushItem'),
      unshiftItem: () => alert('List unshiftItem'),
      removeItem: (i) => alert(`List removeItem ${i}`),
      moveItemDown: (i) => alert(`List moveItemDown ${i}`),
      moveItemUp: (i) => alert(`List moveItemUp ${i}`),
    };
  }
  if (meta.category === 'container' || meta.category === 'context') {
    block.content = {};
    Object.keys(block.areas).forEach((key) => {
      block.content[key] = () => (
        <div key={key} style={{ border: '1px solid red', padding: 10 }}>
          {key}
        </div>
      );
    });
  }
  if (meta.category === 'input') {
    block.methods = {
      ...block.methods,
      setValue,
    };
    block.value = value;
  }

  return block;
};

export default mockBlockProps;
