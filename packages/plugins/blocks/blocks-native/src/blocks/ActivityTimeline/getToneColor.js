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

/**
 * The colour of an event's icon for its tone: neutral (the secondary label), primary or info
 * (the tint), success, warning or danger; a theme token name such as `purple-6`; or any colour.
 *
 * @param {Object} params
 * @param {string} [params.tone]
 * @param {Object} params.colors getTimelineColors.
 * @param {Object} params.tokens
 * @returns {string}
 */
function getToneColor({ tone, colors, tokens }) {
  switch (tone) {
    case undefined:
    case null:
    case 'neutral':
      return colors.secondary;
    case 'primary':
      return colors.tint;
    case 'info':
      return colors.info;
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'danger':
    case 'error':
      return colors.danger;
    default:
      if (type.isString(tokens[tone])) {
        return tokens[tone];
      }
      return tone;
  }
}

export default getToneColor;
