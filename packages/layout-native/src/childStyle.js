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

import flexChildStyle from './flexChildStyle.js';
import isFlexChild from './isFlexChild.js';
import percentOfColumns from './percentOfColumns.js';
import resolveColumn from './resolveColumn.js';

const SELF_ALIGN_MAP = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
};

/**
 * Where a block sits in its area. grid.css sizes a column as span / 24 * (100% + gap) - gap, with
 * the area's column gap between columns. A React Native percentage cannot subtract a gap, so the
 * area is widened by the gap (containerStyle's negative left margin) and each block takes the gap
 * as left padding: span / 24 of the widened area, less the padding, is the web's width, and an
 * offset of offset / 24 of it is the web's margin.
 *
 * @param {Object} params
 * @param {number} params.columnGap The column gap of the area the block is in.
 * @param {Object} params.layout The block's evaluated layout.
 * @param {string} params.breakpoint The current breakpoint.
 */
function childStyle({ breakpoint, columnGap, layout }) {
  const style = {
    alignSelf: SELF_ALIGN_MAP[layout.selfAlign] ?? layout.selfAlign,
    paddingLeft: columnGap > 0 ? columnGap : undefined,
  };
  if (isFlexChild(layout)) {
    return { ...style, ...flexChildStyle({ columnGap, layout }) };
  }
  const { span, offset, push, pull } = resolveColumn({ breakpoint, layout });
  if (span === 0) {
    return { display: 'none' };
  }
  const placed = {
    ...style,
    marginLeft: offset > 0 ? percentOfColumns(offset) : undefined,
    width: percentOfColumns(span),
  };
  if (push > 0 || pull > 0) {
    placed.position = 'relative';
  }
  if (push > 0) placed.left = percentOfColumns(push);
  if (pull > 0) placed.right = percentOfColumns(pull);
  return placed;
}

export default childStyle;
