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

const COLOR_SCHEMES = ['light', 'dark'];

function isPositiveInt(value) {
  return type.isInt(value) && value > 0;
}

// Checks the viewport a headless page is opened with: width and height in CSS
// pixels, and the colour scheme the page's `prefers-color-scheme` reports.
// Returns an error message, or undefined when every given option is valid.
function validateViewport({ width, height, colorScheme }) {
  if (!type.isUndefined(width) && !isPositiveInt(width)) {
    return `Viewport width must be a positive integer (CSS pixels). Received ${JSON.stringify(
      width
    )}.`;
  }
  if (!type.isUndefined(height) && !isPositiveInt(height)) {
    return `Viewport height must be a positive integer (CSS pixels). Received ${JSON.stringify(
      height
    )}.`;
  }
  if (!type.isUndefined(colorScheme) && !COLOR_SCHEMES.includes(colorScheme)) {
    return `Color scheme must be "light" or "dark". Received ${JSON.stringify(colorScheme)}.`;
  }
  return undefined;
}

export { COLOR_SCHEMES };
export default validateViewport;
