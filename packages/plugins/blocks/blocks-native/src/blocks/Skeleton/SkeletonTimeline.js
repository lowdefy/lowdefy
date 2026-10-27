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
import SkeletonShape from '../../skeleton/SkeletonShape.js';

const RAIL_WIDTH = 28;
const MARKER_SIZE = 24;

/**
 * A loading activity timeline: `count` entries on a rail, as the ActivityTimeline draws them, each
 * a circle where the marker sits and one or two lines beside it (the event, then its meta), the
 * rail line joining the circles.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {number} props.count
 */
function SkeletonTimeline({ blockId, count }) {
  const { tokens } = useTheme();
  return Array.from({ length: count }, (_, entry) => {
    const last = entry === count - 1;
    return (
      <View key={entry} style={{ flexDirection: 'row' }} testID={`${blockId}_entry_${entry}`}>
        <View style={{ alignItems: 'center', width: RAIL_WIDTH }}>
          <SkeletonShape
            style={{ borderRadius: MARKER_SIZE / 2, height: MARKER_SIZE, width: MARKER_SIZE }}
          />
          {last ? null : (
            <View
              style={{
                backgroundColor: tokens.colorSeparator,
                flexGrow: 1,
                minHeight: 4,
                width: 1.5,
              }}
            />
          )}
        </View>
        <View
          style={{
            flexBasis: 0,
            flexGrow: 1,
            minWidth: 0,
            paddingBottom: last ? 0 : 16,
            paddingLeft: 12,
            paddingTop: 2,
          }}
        >
          <SkeletonLine
            textStyle="subheadline"
            width={getBarWidth({ index: entry, max: 85, min: 55 })}
          />
          {entry % 3 === 1 ? null : (
            <SkeletonLine
              textStyle="footnote"
              width={getBarWidth({ index: entry, max: 45, min: 25, salt: 1 })}
            />
          )}
        </View>
      </View>
    );
  });
}

export default SkeletonTimeline;
