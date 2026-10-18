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
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@lowdefy/client-native';

import SkeletonListRow, { getTextInset } from './SkeletonListRow.js';

/**
 * `count` loading list rows (SkeletonListRow), each but the last with a hairline separator under
 * it, inset to the text, as a List draws its rows.
 *
 * @param {Object} props
 * @param {boolean} props.avatar
 * @param {string} props.blockId
 * @param {number} props.count
 * @param {number} [props.first] The index of the first row, so rows of later sections vary on.
 * @param {number} props.lines
 * @param {boolean} props.trailing
 */
function SkeletonRows({ avatar, blockId, count, first = 0, lines, trailing }) {
  const { tokens } = useTheme();
  return Array.from({ length: count }, (_, row) => {
    const index = first + row;
    return (
      <View key={row}>
        <SkeletonListRow
          avatar={avatar}
          index={index}
          lines={lines}
          testID={`${blockId}_row_${index}`}
          trailing={trailing}
        />
        {row === count - 1 ? null : (
          <View
            style={{
              backgroundColor: tokens.colorSeparator,
              bottom: 0,
              height: StyleSheet.hairlineWidth,
              left: getTextInset({ avatar }),
              position: 'absolute',
              right: 0,
            }}
          />
        )}
      </View>
    );
  });
}

export default SkeletonRows;
