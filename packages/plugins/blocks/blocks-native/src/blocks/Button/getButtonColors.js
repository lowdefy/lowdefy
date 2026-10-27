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
import { type } from '@lowdefy/helpers';
import { withAlpha } from '@lowdefy/client-native';

const PRESET_COLORS = new Set([
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'pink',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
]);

// The deprecated `type` as a colour and variant, as the web Button reads it.
const TYPE_STYLES = {
  danger: { color: 'danger', variant: 'solid' },
  dashed: { color: 'default', variant: 'dashed' },
  default: { color: 'default', variant: 'outlined' },
  link: { color: 'primary', variant: 'link' },
  primary: { color: 'primary', variant: 'solid' },
  text: { color: 'default', variant: 'text' },
};

// The iOS button styles, which take the tint when no colour is set, as iOS buttons do.
const IOS_VARIANTS = new Set(['tinted', 'gray', 'plain']);

const NAMED_COLORS = new Set(['danger', 'default', 'primary', ...PRESET_COLORS]);

// Without a variant the web Button draws antd's `type`, where a preset colour has no effect and
// any other colour replaces the primary colour.
function getColorAndVariant({ properties }) {
  if (properties.variant) {
    const fallback = IOS_VARIANTS.has(properties.variant) ? 'primary' : 'default';
    return { color: properties.color ?? fallback, variant: properties.variant };
  }
  const typeStyle = TYPE_STYLES[properties.type ?? 'primary'];
  const customColor = type.isString(properties.color) && !NAMED_COLORS.has(properties.color);
  if (customColor && typeStyle.color === 'primary') {
    return { color: properties.color, variant: typeStyle.variant };
  }
  return typeStyle;
}

function resolveColor({ color, danger, tokens }) {
  if (danger === true || color === 'danger') return tokens.colorError;
  if (color === 'primary') return tokens.colorTint;
  if (color === 'default') return null;
  if (PRESET_COLORS.has(color)) return tokens[color];
  return color;
}

/**
 * The colours of a Button in the iOS button styles, for its `color`, `variant` (or the deprecated
 * `type`), `danger` and `ghost`:
 *
 * - `solid` is iOS's filled button: the colour under white text (the default, in the tint).
 * - `tinted`: the colour over a tint of it.
 * - `gray` and antd's `filled`: the colour over the grey system fill.
 * - `plain`, `text` and `link`: the colour on no fill.
 * - `outlined` and `dashed`: the colour in a hairline border.
 *
 * A preset name takes the theme's colour, `primary` the tint, and any other colour is used as
 * written. The `default` colour is the label colour.
 *
 * @param {Object} params
 * @param {boolean} params.isDark
 * @param {Object} params.properties The Button's properties.
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ backgroundColor: string, borderColor: string, borderStyle: string, borderWidth: number, plain: boolean, pressedColor: string, pressedOpacity: number, textColor: string }}
 *   `plain` is a style with no fill, whose title is regular weight; pressing draws
 *   `pressedColor` behind it at `pressedOpacity`.
 */
function getButtonColors({ isDark, properties, tokens }) {
  const { color, variant } = getColorAndVariant({ properties });
  const main = resolveColor({ color, danger: properties.danger, tokens });
  const accent = main ?? tokens.colorLabel;
  const border = {
    borderColor: main ?? tokens.colorOpaqueSeparator,
    borderStyle: 'solid',
    borderWidth: StyleSheet.hairlineWidth * 2,
  };
  const none = { borderColor: 'transparent', borderStyle: 'solid', borderWidth: 0 };
  if (properties.ghost === true) {
    return {
      ...border,
      backgroundColor: 'transparent',
      plain: false,
      pressedColor: tokens.colorQuaternarySystemFill,
      pressedOpacity: 1,
      textColor: main ?? tokens.colorLabel,
    };
  }
  switch (variant) {
    case 'solid':
      return {
        ...none,
        backgroundColor: main ?? tokens.colorLabel,
        plain: false,
        pressedColor: main ?? tokens.colorLabel,
        pressedOpacity: 0.8,
        textColor: main === null ? tokens.colorCell : '#FFFFFF',
      };
    case 'tinted':
      return {
        ...none,
        backgroundColor: withAlpha({ alpha: isDark ? 0.24 : 0.14, color: accent }),
        plain: false,
        pressedColor: withAlpha({ alpha: isDark ? 0.34 : 0.22, color: accent }),
        pressedOpacity: 1,
        textColor: accent,
      };
    case 'gray':
    case 'filled':
      return {
        ...none,
        backgroundColor: tokens.colorTertiarySystemFill,
        plain: false,
        pressedColor: tokens.colorSystemFill,
        pressedOpacity: 1,
        textColor: accent,
      };
    case 'plain':
    case 'text':
    case 'link':
      return {
        ...none,
        backgroundColor: 'transparent',
        plain: true,
        pressedColor: 'transparent',
        pressedOpacity: 0.4,
        textColor: variant === 'link' ? main ?? tokens.colorTint : accent,
      };
    case 'dashed':
      return {
        ...border,
        backgroundColor: 'transparent',
        borderStyle: 'dashed',
        plain: false,
        pressedColor: tokens.colorQuaternarySystemFill,
        pressedOpacity: 1,
        textColor: accent,
      };
    default:
      return {
        ...border,
        backgroundColor: 'transparent',
        plain: false,
        pressedColor: tokens.colorQuaternarySystemFill,
        pressedOpacity: 1,
        textColor: accent,
      };
  }
}

export default getButtonColors;
