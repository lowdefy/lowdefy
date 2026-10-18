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

/**
 * The colours an Illustration's `var(--name)` references take in the mode showing: the theme's
 * colour tokens (`var(--colorPrimary)`), then the block's `colors`, then in dark mode its
 * `colorsDark` over them. Each configured colour is a palette hue, a theme token or a CSS
 * colour (resolveColor).
 *
 * @param {Object} params
 * @param {Object} [params.colors] Colours by name.
 * @param {Object} [params.colorsDark] Colours by name in dark mode.
 * @param {boolean} params.isDark Whether dark mode is showing.
 * @param {Object} params.tokens The theme tokens of the mode showing.
 * @returns {Object} Colours by name.
 */
function getIllustrationColors({ colors = {}, colorsDark = {}, isDark, tokens }) {
  const configured = isDark ? { ...colors, ...colorsDark } : colors;
  const resolved = {};
  Object.keys(tokens).forEach((name) => {
    if (type.isString(tokens[name])) {
      resolved[name] = tokens[name];
    }
  });
  Object.keys(configured).forEach((name) => {
    resolved[name] = resolveColor({ color: configured[name], tokens });
  });
  return resolved;
}

export default getIllustrationColors;
