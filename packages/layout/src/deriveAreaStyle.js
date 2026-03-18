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

const BREAKPOINT_SUFFIXES = ['sm', 'md', 'lg', 'xl', '2xl'];

function setGapAxis(style, axis, value) {
  if (type.isNumber(value)) {
    style[`--lf-gap-${axis}`] = `${Math.round(value)}px`;
    return;
  }
  if (type.isObject(value)) {
    if (value.xs != null) {
      style[`--lf-gap-${axis}`] = `${Math.round(value.xs)}px`;
    }
    for (const bp of BREAKPOINT_SUFFIXES) {
      if (value[bp] != null) {
        style[`--lf-gap-${axis}-${bp}`] = `${Math.round(value[bp])}px`;
      }
    }
  }
}

function deriveAreaStyle(area) {
  const { gap } = area;
  if (type.isNone(gap)) return {};

  const style = {};

  if (type.isNumber(gap)) {
    const px = `${Math.round(gap)}px`;
    style['--lf-gap-x'] = px;
    style['--lf-gap-y'] = px;
    return style;
  }

  if (type.isArray(gap)) {
    setGapAxis(style, 'x', gap[0]);
    setGapAxis(style, 'y', gap[1]);
    return style;
  }

  if (type.isObject(gap)) {
    setGapAxis(style, 'x', gap);
    setGapAxis(style, 'y', gap);
    return style;
  }

  return style;
}

export default deriveAreaStyle;
