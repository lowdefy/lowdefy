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

import { withAlpha } from '@lowdefy/client-native';

import getToneColor from '../../shared/getToneColor.js';

/**
 * A link chip's colours, from its config's `color` or `tone`, in the mode showing: the icon and
 * key in the tone over a soft tint of it, the title in the label colour. A neutral chip, or a
 * colour withAlpha cannot tint, sits on the tertiary system fill with its key in the label colour.
 *
 * @param {Object} params
 * @param {{ color?: string, tone?: string }} params.chip The chip's config.
 * @param {boolean} params.isDark
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {{ background: string, icon: string, key: string, title: string }}
 */
function getLinkChipColors({ chip, isDark, tokens }) {
  const accent = getToneColor({ action: chip, tokens });
  const tint = withAlpha({ alpha: isDark ? 0.22 : 0.12, color: accent });
  if (chip.tone === 'neutral' || tint === accent) {
    return {
      background: tokens.colorTertiarySystemFill,
      icon: accent,
      key: tokens.colorLabel,
      title: tokens.colorSecondaryLabel,
    };
  }
  return { background: tint, icon: accent, key: accent, title: tokens.colorLabel };
}

export default getLinkChipColors;
