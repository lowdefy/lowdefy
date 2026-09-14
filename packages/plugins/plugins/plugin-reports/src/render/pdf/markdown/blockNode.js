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

import { dividerContent } from '../styles.js';
import blockNodes from './blockNodes.js';
import blockquoteBlock from './blockquoteBlock.js';
import codeBlock from './codeBlock.js';
import headingBlock from './headingBlock.js';
import listBlock from './listBlock.js';
import paragraphContent from './paragraphContent.js';
import tableBlock from './tableBlock.js';

// Map one block-level mdast node to zero or more pdfmake content nodes.
function blockNode(node, state) {
  switch (node.type) {
    case 'heading':
      return headingBlock(node, state);
    case 'paragraph':
      return paragraphContent(node, state);
    case 'code':
      return codeBlock(node, state);
    case 'blockquote':
      return blockquoteBlock(node, state);
    case 'list':
      return listBlock(node, state);
    case 'table':
      return tableBlock(node, state);
    case 'thematicBreak':
      return [dividerContent(state.contentWidth ?? 0)];
    case 'html':
      // Raw HTML contributes nothing: custom HTML belongs in the Html block,
      // which renders it properly, rather than being half-interpreted here.
      state.htmlNodes += 1;
      return [];
    default:
      // A block wrapper without special styling (a footnote definition, a block
      // a future remark plugin adds) contributes its children.
      return blockNodes(node.children, state);
  }
}

export default blockNode;
