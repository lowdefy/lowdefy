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

import TEXT_TONE_COLORS from '@lowdefy/block-utils/format/textToneColors.js';
import TONE_COLORS from '@lowdefy/block-utils/format/toneColors.js';
import { type } from '@lowdefy/helpers';

// A colour name as a theme token, so it follows the theme and dark mode:
// antd's status names (success, warning, error, info, processing) and preset
// colours (blue, green, ...). `text: true` picks the text variant of a status
// colour, which antd tunes for contrast. Anything else is used as CSS.
function resolveToneColor({ color, text = false }) {
  if (type.isNone(color)) return undefined;
  if (text && !type.isUndefined(TEXT_TONE_COLORS[color])) return TEXT_TONE_COLORS[color];
  return TONE_COLORS[color] ?? color;
}

export default resolveToneColor;
