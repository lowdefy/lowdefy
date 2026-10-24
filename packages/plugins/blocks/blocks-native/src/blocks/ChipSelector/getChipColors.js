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
import { resolveColor, withAlpha } from '@lowdefy/client-native';

const WHITE = '#FFFFFF';

// A soft fill of the accent behind the selected chip. withAlpha tints a hex colour only; a colour
// it cannot read (an rgb() or CSS name) gets the neutral fill, so the label never sits on a fill
// of its own colour.
function getSoftTint({ accent, isDark, tokens }) {
  const tint = withAlpha({ alpha: isDark ? 0.24 : 0.15, color: accent });
  if (tint === accent) {
    return tokens.colorTertiarySystemFill;
  }
  return tint;
}

/**
 * The colours of one chip of a ChipSelector, from its option's `color`, in the mode showing:
 *
 * - `{ fg, bg, fgDark, bgDark }` is a mark drawn fg on bg, as a space's mark on the web: the tile
 *   is bg with the icon in fg, and a selected chip fills with bg, its border and label in fg (its
 *   tile flips to fg with the icon in bg, so it stays visible on the bg fill). Dark mode takes
 *   fgDark and bgDark; without bgDark the fill is a soft tint of the dark fg, never the light bg.
 * - A string is a palette hue (`blue`, `teal`, `amber`, ...), a token name or a hex colour: the
 *   tile is the colour with a white icon, a selected chip fills with the colour at about 15%.
 * - No colour is the app's tint.
 *
 * @param {Object} params
 * @param {Object|string} [params.color] The option's colour.
 * @param {boolean} params.isDark
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ accent: string, tint: string, tile: { background: string, foreground: string },
 *   selectedTile: { background: string, foreground: string } }}
 */
function getChipColors({ color, isDark, tokens }) {
  if (type.isObject(color)) {
    const accent = (isDark ? color.fgDark : undefined) ?? color.fg;
    const tint = (isDark ? color.bgDark : color.bg) ?? getSoftTint({ accent, isDark, tokens });
    return {
      accent,
      tint,
      tile: { background: tint, foreground: accent },
      selectedTile: { background: accent, foreground: tint },
    };
  }
  const accent = type.isString(color) ? resolveColor({ color, tokens }) : tokens.colorTint;
  const tile = { background: accent, foreground: WHITE };
  return {
    accent,
    tint: getSoftTint({ accent, isDark, tokens }),
    tile,
    selectedTile: tile,
  };
}

export default getChipColors;
