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

import { markdownToPdfMake } from './markdownToPdfMake.js';
import translateDivider from './translateDivider.js';
import translateGrid from './translateGrid.js';
import translateHeading from './translateHeading.js';
import translateImage from './translateImage.js';
import translateRow from './translateRow.js';
import translateSpacer from './translateSpacer.js';
import translateStack from './translateStack.js';
import translateStat from './translateStat.js';
import translateSvg from './translateSvg.js';
import translateTable from './translateTable.js';
import translateText from './translateText.js';

// Translate one IR node to a pdfmake node. Recurses through `row`/`stack`
// children. `ctx` carries the content width (points) for width-aware nodes and
// the logger for the markdown translator's warnings. Returns null for a node
// that should be skipped (an unresolved image, markdown that renders nothing).
function translateNode(node, ctx) {
  switch (node.kind) {
    case 'heading':
      return translateHeading(node);
    case 'text':
      return translateText(node);
    case 'svg':
      return translateSvg(node);
    case 'grid':
      return translateGrid(node, ctx);
    case 'table':
      return translateTable(node, ctx);
    case 'stat':
      return translateStat(node);
    case 'row':
      return translateRow(node, ctx);
    case 'stack':
      return translateStack(node, ctx);
    case 'divider':
      return translateDivider(node, ctx);
    case 'spacer':
      return translateSpacer(node);
    case 'markdown':
      // Parsed and mapped by the one markdown translator; null when the
      // markdown renders nothing (empty or HTML-only source).
      return markdownToPdfMake(node, ctx);
    case 'image':
      return translateImage(node, ctx);
    default:
      // validateNodes runs first, so an unknown kind should never reach here.
      throw new Error(`Report IR node kind '${node.kind}' cannot be translated to PDF.`);
  }
}

export default translateNode;
