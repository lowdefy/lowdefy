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

import getSemanticColors from './getSemanticColors.js';

// Names people use for a hue that antd's palette calls something else.
const HUE_ALIASES = {
  amber: 'gold',
  indigo: 'geekblue',
  pink: 'magenta',
  teal: 'cyan',
};

const GREY_NAMES = new Set(['default', 'gray', 'grey']);

/**
 * A colour a block's config names, as the theme draws it in the mode showing: a palette hue
 * (`blue`, `gold`, `teal`, ...) is its mode-adjusted 6th shade, `grey` is the secondary label, a
 * token name (`colorSuccess`) is that token, and anything else (a hex or rgb colour) is used as
 * it is.
 *
 * @param {Object} params
 * @param {string} params.color The configured colour.
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {string} A React Native colour.
 */
function resolveColor({ color, tokens }) {
  if (GREY_NAMES.has(color)) {
    return getSemanticColors({ tokens }).secondaryLabel;
  }
  const hue = HUE_ALIASES[color] ?? color;
  if (type.isString(tokens[`${hue}-6`])) {
    return tokens[`${hue}-6`];
  }
  if (type.isString(tokens[color])) {
    return tokens[color];
  }
  return color;
}

export default resolveColor;
