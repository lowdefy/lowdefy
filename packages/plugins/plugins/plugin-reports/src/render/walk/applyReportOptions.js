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

import { type } from '@lowdefy/helpers';

// Attach the block's `report:` hints to the nodes it emitted. A page break
// before the block is a break before its first node; xlsx sheets are named here,
// the only place that holds both the sheetName hint and the source blockId, so
// renderers emit unnamed grids. Copies rather than mutating a renderer's node.
function applyReportOptions({ nodes, block, options }) {
  const withBreak = nodes.map((node, index) => {
    if (index === 0 && options.pageBreakBefore === true) {
      return { ...node, pageBreakBefore: true };
    }
    return node;
  });
  return withBreak.map((node) => {
    if (node.kind === 'grid' && type.isNone(node.sheetName)) {
      return { ...node, sheetName: options.sheetName ?? block.blockId };
    }
    return node;
  });
}

export default applyReportOptions;
