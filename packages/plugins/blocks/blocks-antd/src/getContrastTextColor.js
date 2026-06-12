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

// Returns '#000' or '#fff' for best contrast against a hex background color.
// Returns undefined for non-hex values (named colors, rgb(), etc.) so the
// caller can fall back to antd's default solid text color.
function getContrastTextColor(color) {
  if (!type.isString(color)) return undefined;
  const hex = color.trim().replace(/^#/, '');
  let r;
  let g;
  let b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6 || hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return undefined;
  }
  if ([r, g, b].some((n) => Number.isNaN(n))) return undefined;
  // YIQ perceptual brightness: dark text on light backgrounds, light text on dark.
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000' : '#fff';
}

export default getContrastTextColor;
