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

import React, { useRef } from 'react';
import { View } from 'react-native';
import { convertStyle } from '@lowdefy/style-native';

import getSectionCounts from './getSectionCounts.js';
import getSkeletonVariant from './getSkeletonVariant.js';
import meta from './meta.js';
import SkeletonCard from './SkeletonCard.js';
import SkeletonFrameContext from '../../skeleton/SkeletonFrameContext.js';
import SkeletonHero from './SkeletonHero.js';
import SkeletonInsetGroup from './SkeletonInsetGroup.js';
import SkeletonParagraph from './SkeletonParagraph.js';
import SkeletonRows from './SkeletonRows.js';
import SkeletonShape from '../../skeleton/SkeletonShape.js';
import SkeletonTimeline from './SkeletonTimeline.js';

function SkeletonVariant({ blockId, properties, variant }) {
  const avatar = properties.avatar !== false;
  const trailing = properties.trailing === true;
  const lines = properties.rows ?? 2;
  switch (variant) {
    case 'insetGroup':
      return (
        <SkeletonInsetGroup
          avatar={avatar}
          blockId={blockId}
          counts={getSectionCounts({ count: properties.count, fallback: 4 })}
          header={properties.header !== false}
          lines={lines}
          trailing={trailing}
        />
      );
    case 'hero':
      return <SkeletonHero blockId={blockId} />;
    case 'paragraph':
      return <SkeletonParagraph blockId={blockId} lines={properties.lines ?? 3} />;
    case 'card':
      return <SkeletonCard blockId={blockId} lines={properties.lines ?? 4} />;
    case 'timeline':
      return <SkeletonTimeline blockId={blockId} count={properties.count ?? 3} />;
    default:
      return (
        <SkeletonRows
          avatar={avatar}
          blockId={blockId}
          count={properties.count ?? 3}
          lines={lines}
          trailing={trailing}
        />
      );
  }
}

// A shimmering placeholder shaped like what loads in its place, so the content that replaces it
// lands where the skeleton was. `variant` picks the shape: list rows, inset grouped sections of
// rows, a record hero, a paragraph, a card of text or an activity timeline. With only `count`,
// `rows` or `avatar` it draws list rows; with none of these, one shape of the given width and
// height, full size by default, as the web's. CSS lengths (`120px`, `50%`) become React Native
// ones. The whole skeleton is one "Loading" progress bar to a screen reader.
function Skeleton({ blockId, properties, styles = {} }) {
  const frame = useRef(null);
  const variant = getSkeletonVariant(properties);
  if (variant === 'shape') {
    const { style } = convertStyle({
      height: properties.height ?? '100%',
      width: properties.width ?? '100%',
    });
    return <SkeletonShape busy style={[style, styles.element]} testID={`${blockId}_skeleton`} />;
  }
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      ref={frame}
      style={styles.element}
      testID={`${blockId}_skeleton`}
    >
      <SkeletonFrameContext.Provider value={frame}>
        <SkeletonVariant blockId={blockId} properties={properties} variant={variant} />
      </SkeletonFrameContext.Provider>
    </View>
  );
}

Skeleton.meta = meta;

export default Skeleton;
