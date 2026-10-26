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

import getBarWidth from './getBarWidth.js';
import SkeletonLine from '../../skeleton/SkeletonLine.js';
import SkeletonShape from '../../skeleton/SkeletonShape.js';

const ROW_PADDING = 16;
const GAP = 12;
const LEADING_SIZE = 22;
const TRAILING_SIZE = 20;

// Where a row's separator starts: under the text, as a ListItem's.
function getTextInset({ avatar }) {
  return avatar ? ROW_PADDING + LEADING_SIZE + GAP : ROW_PADDING;
}

/**
 * One loading list row, shaped as a ListItem: an optional leading circle (a status glyph or
 * avatar), a title bar 60 to 80% of the text column, varied by the row, then shorter subtitle
 * bars, and an optional trailing circle. With one line the row is a single-line cell.
 *
 * @param {Object} props
 * @param {boolean} props.avatar Draw the leading circle.
 * @param {number} props.index The row, which varies the bar widths.
 * @param {number} props.lines Lines of text: the title, then subtitle lines.
 * @param {string} [props.testID]
 * @param {boolean} props.trailing Draw the trailing circle.
 */
function SkeletonListRow({ avatar, index, lines, testID, trailing }) {
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: GAP,
        minHeight: 44,
        paddingHorizontal: ROW_PADDING,
        paddingVertical: lines > 1 ? 10 : 11,
      }}
      testID={testID}
    >
      {avatar ? (
        <SkeletonShape
          style={{ borderRadius: LEADING_SIZE / 2, height: LEADING_SIZE, width: LEADING_SIZE }}
        />
      ) : null}
      <View style={{ flexBasis: 0, flexGrow: 1, gap: 1, minWidth: 0 }}>
        <SkeletonLine
          textStyle={lines > 1 ? 'headline' : 'body'}
          width={getBarWidth({ index, max: 80, min: 60 })}
        />
        {Array.from({ length: lines - 1 }, (_, line) => (
          <SkeletonLine
            key={line}
            textStyle="footnote"
            width={getBarWidth({ index, max: 50, min: 30, salt: line + 1 })}
          />
        ))}
      </View>
      {trailing ? (
        <SkeletonShape
          style={{ borderRadius: TRAILING_SIZE / 2, height: TRAILING_SIZE, width: TRAILING_SIZE }}
        />
      ) : null}
    </View>
  );
}

export { getTextInset };
export default SkeletonListRow;
