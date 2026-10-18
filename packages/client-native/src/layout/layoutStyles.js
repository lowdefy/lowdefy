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

import resolveGap from './resolveGap.js';
import resolveLayout from './resolveLayout.js';

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

const SPAN_COLUMNS = 24;

function percentOfColumns(columns) {
  return `${(columns / SPAN_COLUMNS) * 100}%`;
}

function flexGrow(grow) {
  if (grow === true) return 1;
  if (type.isNumber(grow) && grow >= 0) return grow;
  return 0;
}

function flexShrink(shrink) {
  if (shrink === false) return 0;
  if (type.isNumber(shrink) && shrink >= 0) return shrink;
  return 1;
}

function flexBasis(size) {
  if (type.isNumber(size) || type.isString(size)) return size;
  return 'auto';
}

function isFlexChild({ flex, grow, shrink, size }) {
  return !type.isNone(flex) || !type.isNone(grow) || !type.isNone(shrink) || !type.isNone(size);
}

function childStyle(layout) {
  const style = {
    alignSelf: ALIGN_MAP[layout.selfAlign],
    order: layout.order,
  };
  if (isFlexChild(layout)) {
    if (layout.flex === true) {
      return { ...style, flexGrow: 0, flexShrink: 1, flexBasis: 'auto' };
    }
    if (type.isNumber(layout.flex)) {
      return { ...style, flex: layout.flex };
    }
    return {
      ...style,
      flexGrow: flexGrow(layout.grow),
      flexShrink: flexShrink(layout.shrink),
      flexBasis: flexBasis(layout.size),
    };
  }
  const offset = layout.offset ?? 0;
  const span = layout.span ?? SPAN_COLUMNS - offset;
  if (span === 0) {
    return { ...style, display: 'none' };
  }
  return {
    ...style,
    marginLeft: offset > 0 ? percentOfColumns(offset) : undefined,
    width: percentOfColumns(span),
  };
}

function containerStyle({ breakpoint, layout }) {
  return {
    ...resolveGap({ breakpoint, gap: layout.gap }),
    alignItems: ALIGN_MAP[layout.align],
    flexDirection: layout.direction ?? 'row',
    flexWrap: layout.wrap ?? 'wrap',
    justifyContent: JUSTIFY_MAP[layout.justify],
    overflow: layout.overflow,
  };
}

function withoutUndefined(style) {
  return Object.fromEntries(Object.entries(style).filter(([, value]) => !type.isUndefined(value)));
}

// The temporary native layout: a row that wraps, with each block a share of 24 columns, or a
// column, as config's layout and slot settings ask. `container` styles an area laid out by
// `layout`; `child` styles a block placed by its own `layout`. Percentage widths do not subtract
// a horizontal gap, so spans that share a line on the web wrap here when the area sets one.
// layout-native replaces this implementation behind the same interface.
function layoutStyles(layout = {}, breakpoint = 'xs') {
  const resolved = resolveLayout({ breakpoint, layout });
  return {
    container: withoutUndefined(containerStyle({ breakpoint, layout: resolved })),
    child: withoutUndefined(childStyle(resolved)),
  };
}

export default layoutStyles;
