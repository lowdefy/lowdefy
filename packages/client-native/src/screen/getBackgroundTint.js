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

const DEFAULT_HEIGHT = 0.15;
// The tint's strength at the top of the screen. Dark mode takes more: a colour over black reads
// weaker than the same colour over iOS's light grouped grey.
const LIGHT_OPACITY = 0.35;
const DARK_OPACITY = 0.45;

// A theme token (`colorPrimary`), a palette hue (`blue`, its 6th shade in the mode showing), or
// a CSS colour as it is.
function resolveTintColor({ color, tokens }) {
  if (type.isString(tokens[color])) {
    return tokens[color];
  }
  if (type.isString(tokens[`${color}-6`])) {
    return tokens[`${color}-6`];
  }
  return color;
}

/**
 * A Screen's backgroundTint as the gradient draws it in the mode showing: `colorDark` in dark
 * mode (`color` when it has none), its opacity at the top of the screen, and `height`, the
 * fraction of the screen height where it has faded out.
 *
 * @param {Object} params
 * @param {Object} [params.backgroundTint] The Screen's `{ color, colorDark, height }`.
 * @param {boolean} params.isDark Whether dark mode is showing.
 * @param {Object} params.tokens The theme tokens of the mode showing.
 * @returns {{ color: string, height: number, opacity: number }|null} Null for no tint.
 */
function getBackgroundTint({ backgroundTint, isDark, tokens }) {
  if (type.isNone(backgroundTint)) {
    return null;
  }
  const color = isDark ? backgroundTint.colorDark ?? backgroundTint.color : backgroundTint.color;
  return {
    color: resolveTintColor({ color, tokens }),
    height: backgroundTint.height ?? DEFAULT_HEIGHT,
    opacity: isDark ? DARK_OPACITY : LIGHT_OPACITY,
  };
}

export default getBackgroundTint;
