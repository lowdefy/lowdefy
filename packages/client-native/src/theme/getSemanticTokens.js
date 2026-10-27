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

import iosColors from './iosColors.js';
import withAlpha from './withAlpha.js';

/**
 * One mode's full token set: antd's computed tokens with the iOS semantic colours added (see
 * iosColors), and the tint, which is the mode's colorPrimary:
 *
 * - colorTint: the tint of controls, links and the navigation, colorPrimary.
 * - colorTintFill: the tint behind tinted controls and callouts.
 *
 * The antd tokens go last, so an app sets any of these for a mode in its theme
 * (`theme.antd.token`, `lightToken` or `darkToken`), as it sets an antd token.
 *
 * @param {Object} params
 * @param {boolean} params.isDark
 * @param {Object} params.tokens antd's computed tokens for the mode.
 * @returns {Object}
 */
function getSemanticTokens({ isDark, tokens }) {
  return {
    ...iosColors[isDark ? 'dark' : 'light'],
    colorTint: tokens.colorPrimary,
    colorTintFill: withAlpha({ alpha: isDark ? 0.24 : 0.14, color: tokens.colorPrimary }),
    ...tokens,
  };
}

export default getSemanticTokens;
