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

import invalidNode from './invalidNode.js';
import validateFraction from './validateFraction.js';

// The slack absorbs the float error in `span/24` sums (7/24 + 7/24 + 10/24 lands
// just over 1).
const FRACTION_SLACK = 1e-9;

function validateRow(node) {
  const widths = node.widths;
  const children = node.children;
  if (!type.isArray(children) || !type.isArray(widths)) {
    throw invalidNode('row', "'children' and 'widths' must be arrays.");
  }
  if (widths.length !== children.length) {
    throw invalidNode(
      'row',
      `${widths.length} width(s) for ${children.length} child(ren). widths must be parallel to children.`
    );
  }
  let fractionSum = 0;
  widths.forEach((width) => {
    if (width === 'auto' || width === 'fill') return;
    if (!validateFraction(width)) {
      throw invalidNode('row', `width '${width}' must be a fraction in (0, 1], 'auto', or 'fill'.`);
    }
    fractionSum += width;
  });
  // Check the row's budget, not only each entry: fractions summing past the
  // whole row run off the page, and because a document renderer resolves them
  // against the full row width, they starve any content-sized sibling instead
  // of clipping visibly.
  if (fractionSum > 1 + FRACTION_SLACK) {
    throw invalidNode('row', `widths sum to ${fractionSum}, more than the row's width.`);
  }
}

export default validateRow;
