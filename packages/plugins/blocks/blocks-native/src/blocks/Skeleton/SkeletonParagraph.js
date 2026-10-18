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
import { View } from 'react-native';

import getParagraphWidths from './getParagraphWidths.js';
import SkeletonLine from '../../skeleton/SkeletonLine.js';

/**
 * Loading body text: `lines` lines at the Body line height, ending ragged (getParagraphWidths).
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {number} props.lines
 */
function SkeletonParagraph({ blockId, lines }) {
  return (
    <View testID={`${blockId}_paragraph`}>
      {getParagraphWidths({ lines }).map((width, line) => (
        <SkeletonLine key={line} textStyle="body" width={width} />
      ))}
    </View>
  );
}

export default SkeletonParagraph;
