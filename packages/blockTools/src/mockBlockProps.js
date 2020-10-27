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

const mockBlockProps = (exBlock, meta) => {
  const block = JSON.parse(JSON.stringify(exBlock));
  block.blockId = block.id;
  if (block.blocks) {
    if (!block.areas) block.areas = {};
    block.areas.content = block.blocks;
  }
  if (block.areas) {
    if (meta.category === 'list') {
      block.list = [];
      block.areas.content.forEach((bl) => {
        block.list.push({
          content: () => (
            <div key={bl.id} style={{ border: '1px solid red', padding: 10, width: '100%' }}>
              {bl.id}
            </div>
          ),
        });
      });
    } else {
      block.content = {};
      Object.keys(block.areas).forEach((key) => {
        block.content[key] = () => (
          <div key={key} style={{ border: '1px solid red', padding: 10, width: '100%' }}>
            {key}
          </div>
        );
      });
    }
  }
  if (block.actions) {
    block.methods = {
      callAction: (action) => alert(JSON.stringify(action, null, 2)),
    };
  }
  return block;
};

export default mockBlockProps;
