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

import React from 'react';
import { type } from '@lowdefy/helpers';

import NoValueAvatar from './NoValueAvatar.js';
import OptionGlyph from '../../shared/OptionGlyph.js';

const AVATAR_SIZE = 28;
const GLYPH_SIZE = 20;

/**
 * The leading glyph of a picker sheet row: the dashed circle of the row that stands for no
 * value, an option's avatar at 28pt (its picture, or its initials), or its SF Symbol or icon at
 * 20pt. Nothing for an option with none of them.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {Object} props.colors getSemanticColors' colours.
 * @param {Object} props.components
 * @param {boolean} props.isDark
 * @param {Object} props.row A getPickerSheetRows row.
 * @param {Object} props.tokens
 */
function PickerRowLeading({ blockId, colors, components, isDark, row, tokens }) {
  if (row.noValue) {
    return (
      <NoValueAvatar
        color={colors.tertiaryLabel}
        size={AVATAR_SIZE}
        testID={`${blockId}_option_${row.key}_none`}
      />
    );
  }
  if (row.option === null) {
    return null;
  }
  return (
    <OptionGlyph
      avatar={row.option.avatar}
      color={row.option.iconColor}
      components={components}
      icon={row.option.icon}
      isDark={isDark}
      size={type.isObject(row.option.avatar) ? AVATAR_SIZE : GLYPH_SIZE}
      symbol={row.option.symbol}
      testID={`${blockId}_option_${row.key}_glyph`}
      tokens={tokens}
    />
  );
}

export { AVATAR_SIZE };
export default PickerRowLeading;
