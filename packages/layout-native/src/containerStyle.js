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

import resolveGap from './resolveGap.js';

const ALIGN_MAP = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
  stretch: 'stretch',
};

const JUSTIFY_MAP = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

const OVERFLOW = new Set(['hidden', 'scroll', 'visible']);

/**
 * How an area lays out its blocks: a wrapping row unless direction says otherwise, with the
 * slot's align, justify, wrap and overflow. The row gap is a gap; the column gap widens the area
 * to its left by the gap (a negative margin), and its blocks take the gap as left padding
 * (childStyle).
 *
 * @param {Object} params
 * @param {Object} params.layout The area's evaluated slot layout.
 * @param {string} params.breakpoint The current breakpoint.
 * @returns {{ style: Object, columnGap: number }} The area's style, and the column gap its blocks
 *   are placed with.
 */
function containerStyle({ breakpoint, layout }) {
  const { x, y } = resolveGap({ breakpoint, gap: layout.gap });
  const style = {
    alignItems: ALIGN_MAP[layout.align],
    flexDirection: layout.direction ?? 'row',
    flexWrap: layout.wrap ?? 'wrap',
    justifyContent: JUSTIFY_MAP[layout.justify],
    overflow: OVERFLOW.has(layout.overflow) ? layout.overflow : undefined,
    rowGap: y > 0 ? y : undefined,
  };
  if (x > 0) {
    style.alignSelf = 'stretch';
    style.marginLeft = -x;
  }
  return { style, columnGap: x };
}

export default containerStyle;
