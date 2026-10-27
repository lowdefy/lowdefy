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

// borderRadius: one to four values, in CSS order (top-left, top-right,
// bottom-right, bottom-left). Elliptical corners ("10px / 20px") have no
// React Native form.
function expandBorderRadius({ key, value }) {
  if (String(value).includes('/')) {
    return {
      error: `"${key}: ${value}" sets elliptical corners, which React Native does not support.`,
    };
  }
  const parts = splitValueParts(value);
  const [topLeft, topRight = topLeft, bottomRight = topLeft, bottomLeft = topRight] = parts;
  if (parts.length === 1) {
    return convertParts([[key, topLeft]]);
  }
  if (parts.length > 4) {
    return { error: `"${key}: ${value}" has more than four values.` };
  }
  return convertParts([
    ['borderTopLeftRadius', topLeft],
    ['borderTopRightRadius', topRight],
    ['borderBottomRightRadius', bottomRight],
    ['borderBottomLeftRadius', bottomLeft],
  ]);
}

export default expandBorderRadius;
