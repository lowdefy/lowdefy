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

// Matches ant-design Input's line-height ratio at the default font size,
// plus the 8px top/bottom padding on the ProseMirror editable area.
const LINE_HEIGHT = '1.5714em';
const VERTICAL_PADDING = 16;

function calcRows(n) {
  return `calc(${n} * ${LINE_HEIGHT} + ${VERTICAL_PADDING}px)`;
}

const DEFAULT_MIN_ROWS = 5;

// Translate TextArea-style rows/autoSize props into React inline CSS applied
// to the EditorContent wrapper. The wrapper becomes the scroll container;
// ProseMirror's editable inside grows naturally.
function computeHeightStyle({ rows, autoSize }) {
  if (type.isInt(rows) && rows >= 1) {
    const h = calcRows(rows);
    return { minHeight: h, maxHeight: h, overflowY: 'auto' };
  }
  if (autoSize === true) {
    return { minHeight: calcRows(1), maxHeight: 'none' };
  }
  if (type.isObject(autoSize)) {
    const style = {};
    if (type.isInt(autoSize.minRows) && autoSize.minRows >= 1) {
      style.minHeight = calcRows(autoSize.minRows);
    }
    if (type.isInt(autoSize.maxRows) && autoSize.maxRows >= 1) {
      style.maxHeight = calcRows(autoSize.maxRows);
      style.overflowY = 'auto';
    }
    if (Object.keys(style).length > 0) return style;
  }
  return { minHeight: calcRows(DEFAULT_MIN_ROWS) };
}

export default computeHeightStyle;
