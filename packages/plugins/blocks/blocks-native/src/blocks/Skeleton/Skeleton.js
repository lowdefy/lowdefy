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
import { type } from '@lowdefy/helpers';
import { convertStyle } from '@lowdefy/style-native';

import meta from './meta.js';
import SkeletonRows from './SkeletonRows.js';
import SkeletonShape from '../../skeleton/SkeletonShape.js';

// A shimmering placeholder for a loading block. With `count`, `rows` or `avatar` it draws loading
// list rows (an avatar and two lines each, by default); otherwise one shape of the given width and
// height, full size by default, as the web's. CSS lengths (`120px`, `50%`) become React Native
// ones.
function Skeleton({ blockId, properties, styles = {} }) {
  const drawsRows =
    !type.isNone(properties.count) ||
    !type.isNone(properties.rows) ||
    !type.isNone(properties.avatar);
  if (drawsRows) {
    return (
      <View style={styles.element}>
        <SkeletonRows
          avatar={properties.avatar !== false}
          blockId={blockId}
          count={properties.count ?? 3}
          rows={properties.rows ?? 2}
        />
      </View>
    );
  }
  const { style } = convertStyle({
    height: properties.height ?? '100%',
    width: properties.width ?? '100%',
  });
  return <SkeletonShape style={[style, styles.element]} testID={`${blockId}_skeleton`} />;
}

Skeleton.meta = meta;

export default Skeleton;
