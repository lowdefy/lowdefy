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

import flexToClasses from './flexToClasses.js';
import selfAlignToClass from './selfAlignToClass.js';
import { isMap, isOperatorNode, isScalar, mapKeys, scalarValue } from './nodeHelpers.js';

const SPAN_KEYS = ['span', 'offset'];
const FLEX_KEYS = ['flex', 'grow', 'shrink', 'size'];
// Responsive objects, push/pull and disabled have no single-class equivalent:
// a responsive offset would have to be accumulated per breakpoint, and
// push/pull are relative offsets with no Tailwind counterpart. They are
// reported for the author instead of guessed at.
const MANUAL_KEYS = ['push', 'pull', 'disabled', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function skip(reason) {
  return { kind: 'skip', reason, classes: [], consumed: [] };
}

// Decides what a single child block becomes: a grid cell, a flex item, an
// untouched passenger, or a site the codemod refuses to rewrite.
function classifyChild({ node }) {
  const existingClass = node.get('class', true);
  if (existingClass !== undefined && !isScalar(existingClass)) {
    return skip('class: is not a plain string, so generated classes cannot be merged into it');
  }

  const layout = node.get('layout', true);
  if (layout === undefined) return { kind: 'plain', classes: [], consumed: [] };
  if (!isMap(layout)) return skip('layout: is not a mapping');
  if (isOperatorNode(layout)) return skip('layout: is operator-valued');

  const keys = mapKeys(layout);
  const manual = keys.filter((key) => MANUAL_KEYS.includes(key));
  if (manual.length > 0) return skip(`layout.${manual.join(', layout.')} has no class equivalent`);

  const dynamic = keys.filter((key) => isOperatorNode(layout.get(key, true)));
  if (dynamic.length > 0) return skip(`layout.${dynamic.join(', layout.')} is operator-valued`);

  const spanKeys = keys.filter((key) => SPAN_KEYS.includes(key));
  const flexKeys = keys.filter((key) => FLEX_KEYS.includes(key));
  if (spanKeys.length > 0 && flexKeys.length > 0) {
    return skip('layout mixes span/offset with the flex keys');
  }

  const classes = [];
  const consumed = [...spanKeys, ...flexKeys];

  if (keys.includes('selfAlign')) {
    const selfAlign = scalarValue(layout, 'selfAlign');
    const className = selfAlignToClass(selfAlign);
    if (className === null) return skip(`layout.selfAlign ${JSON.stringify(selfAlign)} is unknown`);
    classes.push(className);
    consumed.push('selfAlign');
  }

  if (keys.includes('order')) {
    const order = scalarValue(layout, 'order');
    if (!Number.isInteger(order)) return skip('layout.order is not an integer');
    classes.push(`order-${order}`);
    consumed.push('order');
  }

  if (flexKeys.length > 0) {
    const { classes: flexClasses, unresolved } = flexToClasses({
      flex: scalarValue(layout, 'flex'),
      grow: scalarValue(layout, 'grow'),
      shrink: scalarValue(layout, 'shrink'),
      size: scalarValue(layout, 'size'),
    });
    if (unresolved.length > 0) return skip(`layout.${unresolved.join(', layout.')} is not a value`);
    classes.push(...flexClasses);
    return { kind: 'row', classes, consumed };
  }

  if (spanKeys.length > 0) {
    const span = scalarValue(layout, 'span');
    const offset = scalarValue(layout, 'offset');
    if (span !== undefined && !Number.isInteger(span)) return skip('layout.span is not an integer');
    if (offset !== undefined && !Number.isInteger(offset)) {
      return skip('layout.offset is not an integer');
    }
    return { kind: 'grid', classes, consumed, span, offset };
  }

  return { kind: 'plain', classes, consumed };
}

export default classifyChild;
