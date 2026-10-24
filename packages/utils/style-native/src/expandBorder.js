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

import convertParts from './convertParts.js';
import splitValueParts from './splitValueParts.js';

const nativeBorderStyles = new Set(['solid', 'dashed', 'dotted']);
const webBorderStyles = new Set(['double', 'groove', 'ridge', 'inset', 'outset', 'hidden']);
const lengthPattern = /^-?(?:\d+\.?\d*|\.\d+)[a-z%]*$/i;
const widthKeywords = { thin: '1px', medium: '3px', thick: '5px' };

// border and borderTop/Right/Bottom/Left: width, style and colour in any
// order. React Native has one borderStyle for all sides, so a side may only
// use "solid".
function expandBorder({ key, value }) {
  const side = key.slice('border'.length);
  const trimmed = String(value).trim();
  if (trimmed === 'none' || trimmed === '0') {
    return convertParts([[`border${side}Width`, 0]]);
  }
  const pairs = [];
  for (const part of splitValueParts(trimmed)) {
    if (lengthPattern.test(part) || widthKeywords[part]) {
      pairs.push([`border${side}Width`, widthKeywords[part] ?? part]);
      continue;
    }
    if (nativeBorderStyles.has(part)) {
      if (side === '') {
        pairs.push(['borderStyle', part]);
      } else if (part !== 'solid') {
        return {
          error: `"${key}: ${value}" sets a style for one side, but React Native has one border style for all sides. Use "border" or "borderStyle".`,
        };
      }
      continue;
    }
    if (webBorderStyles.has(part)) {
      return {
        error: `"${key}: ${value}" uses the border style "${part}", which React Native does not support.`,
      };
    }
    pairs.push([`border${side}Color`, part]);
  }
  return convertParts(pairs);
}

export default expandBorder;
