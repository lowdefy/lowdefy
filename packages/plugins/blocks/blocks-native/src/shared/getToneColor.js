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

import { resolveColor } from '@lowdefy/client-native';
import { type } from '@lowdefy/helpers';

import getSemanticColors from './getSemanticColors.js';

/**
 * The fill of a swipe action button: its own `color`, else its `tone`. `neutral` is the secondary
 * label colour, which the row draws over its own background, so the grey is solid and close to
 * iOS's systemGray.
 *
 * @param {Object} params
 * @param {{ color?: string, tone?: string }} params.action
 * @param {Object} params.tokens The block's theme tokens.
 * @returns {string}
 */
function getToneColor({ action, tokens }) {
  if (type.isString(action.color)) {
    return resolveColor({ color: action.color, tokens });
  }
  switch (action.tone) {
    case 'danger':
      return tokens.colorError;
    case 'warning':
      return tokens.colorWarning;
    case 'success':
      return tokens.colorSuccess;
    case 'info':
      return tokens.colorInfo;
    case 'neutral':
      return getSemanticColors({ tokens }).secondaryLabel;
    default:
      return tokens.colorPrimary;
  }
}

export default getToneColor;
