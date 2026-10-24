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

import getBarWidth from './getBarWidth.js';
import SkeletonLine from '../../skeleton/SkeletonLine.js';
import SkeletonRows from './SkeletonRows.js';

const GROUPED_INSET = 16;
const GROUPED_RADIUS = 10;

/**
 * Loading sections of an inset grouped List: per section, a header bar where the List's
 * Footnote header sits, then the section's rows in a rounded cell-coloured card inset 16pt from
 * the screen edges, at the List's spacing, so the List that replaces it lands in the same place.
 *
 * @param {Object} props
 * @param {boolean} props.avatar
 * @param {string} props.blockId
 * @param {number[]} props.counts The rows of each section.
 * @param {boolean} props.header Draw the header bars.
 * @param {number} props.lines
 * @param {boolean} props.trailing
 */
function SkeletonInsetGroup({ avatar, blockId, counts, header, lines, trailing }) {
  const { tokens } = useTheme();
  return (
    <View style={{ paddingBottom: GROUPED_INSET }}>
      {counts.map((count, section) => {
        const first = counts.slice(0, section).reduce((sum, rows) => sum + rows, 0);
        const paddingTop = section === 0 ? 16 : 24;
        return (
          <View key={section} testID={`${blockId}_section_${section}`}>
            {header ? (
              <SkeletonLine
                style={{ paddingBottom: 7, paddingHorizontal: GROUPED_INSET * 2, paddingTop }}
                textStyle="footnote"
                width={getBarWidth({ index: section, max: 34, min: 18, salt: 2 })}
              />
            ) : (
              <View style={{ height: paddingTop }} />
            )}
            <View
              style={{
                backgroundColor: tokens.colorCell,
                borderRadius: GROUPED_RADIUS,
                marginHorizontal: GROUPED_INSET,
                overflow: 'hidden',
              }}
              testID={`${blockId}_group_${section}`}
            >
              <SkeletonRows
                avatar={avatar}
                blockId={blockId}
                count={count}
                first={first}
                lines={lines}
                trailing={trailing}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default SkeletonInsetGroup;
