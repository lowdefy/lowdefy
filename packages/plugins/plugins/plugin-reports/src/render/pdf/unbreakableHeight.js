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

// A heading, divider or short text is ~30pt with its margins; used to size a
// candidate group or a stack cell that carries an unbreakable node.
export const MARKER_HEIGHT = 30;
// A heading-plus-chart group, or a row holding one, has to leave room for the
// rest of the page's flow, so only bind when it takes at most this share of the
// page. Anything larger would become a block pdfmake cannot place.
export const GROUP_HEIGHT_LIMIT = 0.9;

// Unbreakable, but measurable only when the node declares a height: pdfmake
// sizes an image or a dimensionless svg from bytes it has not decoded yet.
// `Infinity` says "unbreakable and unmeasurable", which keeps the node out of a
// group instead of counting it as nothing — as zero, a row of natural-size
// images measured 40pt, cleared the group cap, and could become an unbreakable
// block taller than a page.
function declaredHeight(node) {
  if (type.isNumber(node.height)) return node.height + 8;
  return Infinity;
}

// The height a node takes when it cannot be split, or undefined when it flows
// (text, markdown, tables) and so never strands the heading above it. `Infinity`
// is the third answer — see `declaredHeight`.
function unbreakableHeight(node) {
  switch (node.kind) {
    case 'svg':
      return declaredHeight(node);
    case 'image':
      return declaredHeight(node);
    case 'stat':
      return 40;
    case 'row':
      // One unmeasurable child makes the row unmeasurable, because Infinity wins
      // the max.
      return Math.max(40, ...node.children.map((child) => unbreakableHeight(child) ?? 0));
    case 'stack': {
      // A row cell is a stack of [heading, chart]; it is unbreakable when any
      // child is, and as tall as its children together, flowing ones estimated.
      const heights = node.children.map(unbreakableHeight);
      if (heights.every((height) => height === undefined)) return undefined;
      return heights.reduce((sum, height) => sum + (height ?? MARKER_HEIGHT), 0);
    }
    default:
      return undefined;
  }
}

export default unbreakableHeight;
