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

import { StyleSheet } from 'react-native';
import { withAlpha } from '@lowdefy/client-native';

import TONE_PALETTES from './TONE_PALETTES.js';

// A tone's colours: `accent` for the solid fill, the tint behind a filled tag and the dot, and
// `text` for its title. A palette tone takes antd's palette for the mode (6 for the accent, 7 for
// text, which the dark palette lightens); the primary tone the tint; any other colour is used as
// written.
function getTone({ color, tokens }) {
  if (Object.hasOwn(TONE_PALETTES, color)) {
    const palette = TONE_PALETTES[color];
    return { accent: tokens[`${palette}6`], text: tokens[`${palette}7`] };
  }
  if (color === 'primary') {
    return { accent: tokens.colorTint, text: tokens.colorTint };
  }
  return { accent: color, text: color };
}

/**
 * A Tag's colours for its `color` and `variant`, from the theme tokens: a `filled` tag (the
 * default) is the tone's colour over a tint of it, readable in both modes; `outlined` adds a
 * border of the tone on no fill; `solid` fills the tag with the tone under white text. The
 * default tone is grey: the secondary label on the tertiary system fill.
 *
 * @param {Object} params
 * @param {string} [params.color] A status (success, processing, warning, error), a preset colour
 *   name, `primary`, `default` or any colour.
 * @param {boolean} params.isDark
 * @param {Object} params.tokens The block's theme tokens.
 * @param {string} params.variant 'filled', 'outlined' or 'solid'.
 * @returns {{ accent: string, backgroundColor: string, borderColor: string, borderWidth: number, color: string }}
 */
function getTagColors({ color, isDark, tokens, variant }) {
  if (color === undefined || color === 'default') {
    switch (variant) {
      case 'solid':
        return {
          accent: tokens.colorCell,
          backgroundColor: tokens.colorSecondaryLabel,
          borderColor: 'transparent',
          borderWidth: 0,
          color: tokens.colorCell,
        };
      case 'outlined':
        return {
          accent: tokens.colorSecondaryLabel,
          backgroundColor: 'transparent',
          borderColor: tokens.colorOpaqueSeparator,
          borderWidth: StyleSheet.hairlineWidth * 2,
          color: tokens.colorSecondaryLabel,
        };
      default:
        return {
          accent: tokens.colorSecondaryLabel,
          backgroundColor: tokens.defaultBg ?? tokens.colorTertiarySystemFill,
          borderColor: 'transparent',
          borderWidth: 0,
          color: tokens.defaultColor ?? tokens.colorSecondaryLabel,
        };
    }
  }
  const tone = getTone({ color, tokens });
  switch (variant) {
    case 'solid':
      return {
        accent: '#FFFFFF',
        backgroundColor: tone.accent,
        borderColor: 'transparent',
        borderWidth: 0,
        color: tokens.solidTextColor ?? '#FFFFFF',
      };
    case 'outlined':
      return {
        accent: tone.accent,
        backgroundColor: 'transparent',
        borderColor: withAlpha({ alpha: 0.6, color: tone.accent }),
        borderWidth: StyleSheet.hairlineWidth * 2,
        color: tone.text,
      };
    default:
      return {
        accent: tone.accent,
        backgroundColor: withAlpha({ alpha: isDark ? 0.22 : 0.14, color: tone.accent }),
        borderColor: 'transparent',
        borderWidth: 0,
        color: tone.text,
      };
  }
}

export default getTagColors;
