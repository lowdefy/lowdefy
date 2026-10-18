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

import getSemanticColors from '../../shared/getSemanticColors.js';
import resolveColor from '../../shared/resolveColor.js';

/**
 * The colour a status glyph draws in when its config sets none, from the theme of the mode
 * showing, so the glyphs keep one meaning in light and dark mode: grey for not started, gold in
 * progress, blue in review, orange when it needs input, purple when built but not released,
 * green done.
 *
 * @param {Object} params
 * @param {string} params.name The glyph name.
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {string}
 */
function getStatusColor({ name, tokens }) {
  const colors = getSemanticColors({ tokens });
  switch (name) {
    case 'inProgress':
      return tokens.colorWarning;
    case 'inReview':
      return resolveColor({ color: 'blue', tokens });
    case 'needsInput':
      return resolveColor({ color: 'orange', tokens });
    case 'unmerged':
    case 'readyForRelease':
      return resolveColor({ color: 'purple', tokens });
    case 'done':
      return tokens.colorSuccess;
    case 'priorityUrgent':
      return resolveColor({ color: 'volcano', tokens });
    default:
      return colors.secondaryLabel;
  }
}

export default getStatusColor;
