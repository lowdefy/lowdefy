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

// UIKit's semantic colours, for a theme that does not carry them as tokens yet.
const IOS = {
  light: {
    cell: '#FFFFFF',
    nested: '#F2F2F7',
    label: '#000000',
    secondary: 'rgba(60,60,67,0.6)',
    tertiary: 'rgba(60,60,67,0.3)',
    separator: 'rgba(60,60,67,0.29)',
    fill: 'rgba(118,118,128,0.12)',
    fillStrong: 'rgba(120,120,128,0.2)',
    pressed: '#D1D1D6',
  },
  dark: {
    cell: '#1C1C1E',
    nested: '#2C2C2E',
    label: '#FFFFFF',
    secondary: 'rgba(235,235,245,0.6)',
    tertiary: 'rgba(235,235,245,0.3)',
    separator: 'rgba(84,84,88,0.6)',
    fill: 'rgba(118,118,128,0.24)',
    fillStrong: 'rgba(120,120,128,0.36)',
    pressed: '#3A3A3C',
  },
};

/**
 * The colours the timeline and composer draw with: the theme's iOS semantic tokens (colorCell,
 * colorLabel, colorSeparator and the rest) when it has them, else UIKit's colours for the mode.
 *
 * @param {Object} params
 * @param {boolean} params.isDark
 * @param {Object} params.tokens
 * @returns {Object}
 */
function getTimelineColors({ isDark, tokens }) {
  const ios = IOS[isDark ? 'dark' : 'light'];
  const tint = tokens.colorTint ?? tokens.colorPrimary;
  return {
    cell: tokens.colorCell ?? ios.cell,
    nested: tokens.colorCellNested ?? ios.nested,
    pressed: tokens.colorCellPressed ?? ios.pressed,
    label: tokens.colorLabel ?? ios.label,
    secondary: tokens.colorSecondaryLabel ?? ios.secondary,
    tertiary: tokens.colorTertiaryLabel ?? ios.tertiary,
    separator: tokens.colorSeparator ?? ios.separator,
    fill: tokens.colorTertiarySystemFill ?? ios.fill,
    fillStrong: tokens.colorSystemFill ?? ios.fillStrong,
    tint,
    tintFill: tokens.colorTintFill ?? tokens.colorPrimaryBg,
    onTint: tokens.colorTextLightSolid ?? '#FFFFFF',
    success: tokens.colorSuccess,
    warning: tokens.colorWarning,
    warningText: tokens.colorWarningText ?? tokens.colorWarning,
    danger: tokens.colorError,
    info: tokens.colorInfo,
  };
}

export default getTimelineColors;
