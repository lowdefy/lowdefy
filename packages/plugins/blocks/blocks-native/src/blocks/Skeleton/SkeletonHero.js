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

import SkeletonLine from '../../skeleton/SkeletonLine.js';
import SkeletonShape from '../../skeleton/SkeletonShape.js';

const CHIP_HEIGHT = 22;
const AVATAR_SIZE = 20;

/**
 * A loading record hero: the breadcrumb line (a chip pill and a key bar), two title bars at
 * Title 1 height, the second short as a wrapped title ends, and the avatar with a meta bar, at
 * the hero's 10pt rhythm.
 *
 * @param {Object} props
 * @param {string} props.blockId
 */
function SkeletonHero({ blockId }) {
  return (
    <View style={{ gap: 10 }} testID={`${blockId}_hero`}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        <SkeletonShape style={{ borderRadius: CHIP_HEIGHT / 2, height: CHIP_HEIGHT, width: 84 }} />
        <SkeletonLine textStyle="footnote" width={58} />
      </View>
      <View>
        <SkeletonLine textStyle="title1" width="92%" />
        <SkeletonLine textStyle="title1" width="56%" />
      </View>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        <SkeletonShape
          style={{ borderRadius: AVATAR_SIZE / 2, height: AVATAR_SIZE, width: AVATAR_SIZE }}
        />
        <SkeletonLine textStyle="footnote" width={132} />
      </View>
    </View>
  );
}

export default SkeletonHero;
