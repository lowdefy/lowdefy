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

import TONE_PALETTES from './TONE_PALETTES.js';

/**
 * The colour of a Tag's leading dot: the tag's own accent for `dot: true`, or the colour `dot`
 * names, a status or preset colour from the theme palette, `primary` the tint, or any colour.
 *
 * @param {Object} params
 * @param {string} params.accent The tag's accent colour.
 * @param {boolean|string} params.dot The Tag's `dot` property.
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {string}
 */
function getTagDotColor({ accent, dot, tokens }) {
  if (dot === true) return accent;
  if (Object.hasOwn(TONE_PALETTES, dot)) return tokens[`${TONE_PALETTES[dot]}6`];
  if (dot === 'primary') return tokens.colorTint;
  if (dot === 'default') return tokens.colorSecondaryLabel;
  return dot;
}

export default getTagDotColor;
