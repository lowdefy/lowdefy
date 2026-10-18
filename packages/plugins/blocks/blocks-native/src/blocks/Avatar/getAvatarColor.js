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

import resolveColor from '../../shared/resolveColor.js';

// antd hues that carry white initials in both modes; red is left out, so no avatar reads as an
// error.
const PALETTE = [
  'blue',
  'geekblue',
  'purple',
  'magenta',
  'volcano',
  'orange',
  'gold',
  'green',
  'cyan',
];

// The bright hues are a shade deeper in light mode, where their 6th shade is too pale for white
// text. The dark algorithm already darkens every 6th shade.
const BRIGHT_HUES = new Set(['cyan', 'gold', 'green', 'orange']);

// FNV-1a: a small, stable string hash, so a name keeps its colour on every device and release.
function hashString(text) {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * The fill of an avatar: its own `color` when set, else a palette hue picked by a hash of the
 * name's normalised form (trimmed and lower-cased), so a person has the same colour everywhere.
 * The lower case is locale-independent: a device's locale (Turkish lower-cases "I" to a dotless
 * "ı") must not change a person's colour. The hue is read from the theme of the mode
 * showing. With no name and no colour it is the neutral fill.
 *
 * @param {Object} params
 * @param {string} [params.color] A palette hue, token name or colour.
 * @param {boolean} params.isDark
 * @param {string} [params.name]
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ hue: string|null, color: string }}
 */
function getAvatarColor({ color, isDark, name, tokens }) {
  if (type.isString(color)) {
    return { hue: null, color: resolveColor({ color, tokens }) };
  }
  const key = type.isString(name) ? name.trim().toLowerCase() : '';
  if (key === '') {
    return { hue: null, color: tokens.colorFill };
  }
  const hue = PALETTE[hashString(key) % PALETTE.length];
  const shade = !isDark && BRIGHT_HUES.has(hue) ? 7 : 6;
  return { hue, color: tokens[`${hue}-${shade}`] };
}

export default getAvatarColor;
