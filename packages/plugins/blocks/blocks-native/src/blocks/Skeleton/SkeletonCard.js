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
import { useTheme } from '@lowdefy/client-native';

import SkeletonParagraph from './SkeletonParagraph.js';

/**
 * A loading card of text: paragraph lines (SkeletonParagraph) in a cell-coloured rounded card,
 * inset 16pt from the screen edges, with a cell's 16pt padding.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {number} props.lines
 */
function SkeletonCard({ blockId, lines }) {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        backgroundColor: tokens.colorCell,
        borderRadius: 10,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
      testID={`${blockId}_card`}
    >
      <SkeletonParagraph blockId={blockId} lines={lines} />
    </View>
  );
}

export default SkeletonCard;
