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

const keywords = {
  none: [0, 0, 'auto'],
  auto: [1, 1, 'auto'],
  initial: [0, 1, 'auto'],
};
const unitlessPattern = /^-?(?:\d+\.?\d*|\.\d+)$/;

function growShrinkBasis([grow, shrink, basis]) {
  const pairs = [['flexGrow', grow]];
  if (shrink !== undefined) pairs.push(['flexShrink', shrink]);
  if (basis !== undefined) pairs.push(['flexBasis', basis]);
  return convertParts(pairs);
}

// flex: React Native takes a single number, so the CSS forms with a shrink or
// a basis expand to flexGrow, flexShrink and flexBasis.
function expandFlex({ key, value }) {
  if (typeof value === 'number') {
    return convertParts([[key, value]]);
  }
  const trimmed = String(value).trim();
  if (keywords[trimmed]) {
    return growShrinkBasis(keywords[trimmed]);
  }
  const parts = splitValueParts(trimmed);
  if (parts.length === 1) {
    if (unitlessPattern.test(parts[0])) {
      return convertParts([[key, parts[0]]]);
    }
    return convertParts([['flexBasis', parts[0]]]);
  }
  if (parts.length === 2) {
    if (unitlessPattern.test(parts[1])) {
      return growShrinkBasis([parts[0], parts[1]]);
    }
    return growShrinkBasis([parts[0], undefined, parts[1]]);
  }
  if (parts.length === 3) {
    return growShrinkBasis(parts);
  }
  return { error: `"${key}: ${value}" has more than three values.` };
}

export default expandFlex;
