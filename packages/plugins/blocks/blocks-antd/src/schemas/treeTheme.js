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

// Antd tree node design tokens, shared by the inline TreeInput (Tree) and the tree dropdowns
// (TreeSelect), which style their nodes from the same token set.
export const treeNodeTokens = {
  indentSize: {
    type: 'number',
    default: 24,
    description: 'Indent width of each tree level.',
  },
  nodeHoverBg: {
    type: 'string',
    default: 'rgba(0, 0, 0, 0.04)',
    description: 'Background color of a hovered tree node.',
  },
  nodeHoverColor: {
    type: 'string',
    default: 'rgba(0, 0, 0, 0.88)',
    description: 'Text color of a hovered tree node.',
  },
  nodeSelectedBg: {
    type: 'string',
    default: '#e6f4ff',
    description: 'Background color of the selected tree node.',
  },
  nodeSelectedColor: {
    type: 'string',
    default: 'rgba(0, 0, 0, 0.88)',
    description: 'Text color of the selected tree node.',
  },
  switcherSize: {
    type: 'number',
    default: 24,
    description: 'Width of the expand/collapse switcher.',
  },
  titleHeight: {
    type: 'number',
    default: 24,
    description: 'Height of a tree node title.',
  },
};

export default {
  type: 'object',
  description:
    'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
  docs: {
    displayType: 'yaml',
    link: 'https://ant.design/components/tree#design-token',
  },
  properties: treeNodeTokens,
};
