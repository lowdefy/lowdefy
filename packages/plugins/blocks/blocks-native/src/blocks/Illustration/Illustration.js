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

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useReduceMotion, useScreenFocused, useTheme } from '@lowdefy/client-native';
import { type } from '@lowdefy/helpers';

import colorNodes from './colorNodes.js';
import getIllustrationBox from './getIllustrationBox.js';
import getIllustrationColors from './getIllustrationColors.js';
import getLayers from './getLayers.js';
import IllustrationLayer from './IllustrationLayer.js';
import meta from './meta.js';
import parseIllustration from './parseIllustration.js';
import useIllustrationMotion from './useIllustrationMotion.js';

const NO_ANIMATIONS = [];

// With a position the box is drawn at those offsets from where the block is placed and takes no
// room in the layout, so it can sit behind other blocks, such as in the space a large title
// leaves beside it.
function getPlacement({ box, position }) {
  const size = { height: box.height, width: box.width };
  if (type.isNone(position)) {
    return size;
  }
  return { ...size, ...position, position: 'absolute' };
}

function getAccessibility(title) {
  if (type.isNone(title)) {
    return { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };
  }
  return { accessibilityLabel: title, accessibilityRole: 'image', accessible: true };
}

/**
 * A vector drawing from SVG markup, with keyframe animations of its elements: frames that swap,
 * a bob, a blink, a hop. Each element an animation targets (by its id) is drawn in a view of its
 * own, which React Native's native driver moves and fades (getLayers), so the animations run off
 * the JavaScript thread. Colours are `var(--name)` references to `colors` and `colorsDark`, so
 * one drawing follows dark mode. The animations run while the block's screen is shown; with Reduce
 * Motion on, the drawing holds still. It never takes touches.
 */
function Illustration({ blockId, properties, styles = {} }) {
  const { isDark, tokens } = useTheme();
  const reduceMotion = useReduceMotion();
  const focused = useScreenFocused();
  const animations = properties.animations ?? NO_ANIMATIONS;
  const drawing = useMemo(() => parseIllustration({ svg: properties.svg }), [properties.svg]);
  const colorsKey = JSON.stringify([properties.colors, properties.colorsDark]);
  const colored = useMemo(() => {
    const colors = getIllustrationColors({
      colors: properties.colors,
      colorsDark: properties.colorsDark,
      isDark,
      tokens,
    });
    return {
      definitions: colorNodes({ colors, nodes: drawing.definitions }),
      nodes: colorNodes({ colors, nodes: drawing.nodes }),
    };
    // colors and colorsDark are read when their key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorsKey, drawing, isDark, tokens]);
  const targetsKey = animations.map((animation) => animation.target).join(' ');
  const layers = useMemo(
    () =>
      getLayers({
        nodes: colored.nodes,
        targets: new Set(animations.map((animation) => animation.target)),
      }),
    // animations are read when their targets change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colored, targetsKey]
  );
  const box = getIllustrationBox({
    height: properties.height,
    viewBox: drawing.viewBox,
    width: properties.width,
  });
  const motion = useIllustrationMotion({
    animations,
    focused,
    reduceMotion,
    scale: box.scale,
    viewBox: drawing.viewBox,
  });
  return (
    <View
      pointerEvents="none"
      style={[getPlacement({ box, position: properties.position }), styles.element]}
      testID={`${blockId}_illustration`}
      {...getAccessibility(properties.title)}
    >
      <View style={{ position: 'absolute', ...box.drawing }}>
        {layers.map((layer, index) => (
          <IllustrationLayer
            blockId={blockId}
            definitions={colored.definitions}
            drawing={box.drawing}
            key={index}
            layer={layer}
            motion={motion}
            viewBox={drawing.viewBox}
          />
        ))}
      </View>
    </View>
  );
}

Illustration.meta = meta;

export default Illustration;
