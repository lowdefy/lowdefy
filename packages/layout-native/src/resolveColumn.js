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

import breakpointIndex from './breakpointIndex.js';
import breakpoints from './breakpoints.js';

const COLUMNS = 24;
const KEYS = ['span', 'offset', 'order', 'push', 'pull'];

function resolveSpan(span, offset) {
  if (type.isNone(span)) {
    return type.isNone(offset) ? COLUMNS : COLUMNS - offset;
  }
  return span;
}

function setValues(table, breakpoint, values) {
  table[breakpoint] = { ...table[breakpoint], span: resolveSpan(values.span, values.offset) };
  KEYS.filter((key) => key !== 'span' && !type.isNone(values[key])).forEach((key) => {
    table[breakpoint][key] = values[key];
  });
}

// The values deriveLayout (@lowdefy/layout) writes as CSS variables, per breakpoint. The top-level
// span, offset, order, push and pull apply from md; below md a block is full width unless an sm or
// xs layout says otherwise, and an sm layout also applies below sm.
function deriveColumnTable(layout) {
  const { span, offset, order, push, pull, xs, sm, md, lg, xl } = layout;
  const table = { xs: { span: COLUMNS } };
  setValues(table, 'md', { span, offset, order, push, pull });
  if (type.isObject(sm)) {
    setValues(table, 'xs', sm);
    setValues(table, 'sm', sm);
  }
  if (type.isObject(xs)) {
    setValues(table, 'xs', xs);
  }
  if (type.isObject(md)) {
    setValues(table, 'md', { offset, order, push, pull, ...md });
  }
  if (type.isObject(lg)) setValues(table, 'lg', lg);
  if (type.isObject(xl)) setValues(table, 'xl', xl);
  if (type.isObject(layout['2xl'])) setValues(table, '2xl', layout['2xl']);
  return table;
}

/**
 * A grid block's column placement at a breakpoint, as grid.css resolves its CSS variables: each
 * value falls back through the smaller breakpoints to its default.
 *
 * @param {Object} params
 * @param {Object} params.layout The block's evaluated layout.
 * @param {string} params.breakpoint The current breakpoint.
 * @returns {{ span: number, offset: number, order: number, push: number, pull: number }}
 */
function resolveColumn({ layout, breakpoint }) {
  const table = deriveColumnTable(layout);
  const resolved = { span: COLUMNS, offset: 0, order: 0, push: 0, pull: 0 };
  const current = breakpointIndex(breakpoint);
  breakpoints.slice(0, current + 1).forEach(({ name }) => {
    Object.assign(resolved, table[name]);
  });
  return resolved;
}

export { COLUMNS };
export default resolveColumn;
