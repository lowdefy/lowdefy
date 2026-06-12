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

import getContrastTextColor from './getContrastTextColor.js';

// Color styles for a selected selector option, by variant.
// outline: color the border/text + a low-opacity tint of the color.
// solid: fill with the color + auto-contrast text.
// `color` may be a CSS value such as 'var(--ant-color-primary)' for the active
// primary when no explicit color is set.
function getOptionColorStyle({ color, isOutline }) {
  if (isOutline) {
    return {
      color,
      borderColor: color,
      backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
    };
  }
  const contrast = getContrastTextColor(color);
  return { backgroundColor: color, borderColor: color, color: contrast ?? '#fff' };
}

export default getOptionColorStyle;
