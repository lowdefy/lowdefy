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

import SkeletonShape from '../../skeleton/SkeletonShape.js';

const AVATAR_SIZE = 32;
const LINE_WIDTHS = ['62%', '38%', '84%', '50%'];

/**
 * Loading rows shaped like list rows: `count` rows, each an optional round avatar and `rows`
 * lines of text (a wider title line, then shorter meta lines), divided by separators inset to the
 * text, as an inset grouped list draws them.
 *
 * @param {Object} props
 * @param {boolean} props.avatar
 * @param {string} props.blockId
 * @param {number} props.count
 * @param {number} props.rows
 */
function SkeletonRows({ avatar, blockId, count, rows }) {
  const { tokens } = useTheme();
  const textInset = avatar ? 16 + AVATAR_SIZE + 12 : 16;
  return Array.from({ length: count }, (_, index) => (
    <View key={index} testID={`${blockId}_row_${index}`}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: rows > 1 ? 60 : 44,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        {avatar ? (
          <SkeletonShape
            style={{
              borderRadius: AVATAR_SIZE / 2,
              height: AVATAR_SIZE,
              marginRight: 12,
              width: AVATAR_SIZE,
            }}
          />
        ) : null}
        <View style={{ flex: 1, gap: 8 }}>
          {Array.from({ length: rows }, (__, line) => (
            <SkeletonShape
              key={line}
              style={{
                height: line === 0 ? 14 : 11,
                width: LINE_WIDTHS[line % LINE_WIDTHS.length],
              }}
              testID={line === 0 && index === 0 ? `${blockId}_skeleton` : undefined}
            />
          ))}
        </View>
      </View>
      {index < count - 1 ? (
        <View
          style={{
            backgroundColor: tokens.colorSeparator,
            height: StyleSheet.hairlineWidth,
            marginLeft: textInset,
          }}
        />
      ) : null}
    </View>
  ));
}

export default SkeletonRows;
