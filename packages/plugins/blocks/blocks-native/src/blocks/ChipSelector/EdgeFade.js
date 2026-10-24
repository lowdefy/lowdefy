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
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const FADE_WIDTH = 24;

/**
 * One edge fade of a chip strip: a gradient from the surface colour behind the strip to clear,
 * over the chips that scroll under the edge. Its opacity follows the strip's scroll offset.
 *
 * @param {Object} props
 * @param {string} props.color The surface colour behind the strip.
 * @param {string} props.id The gradient id, unique on the page.
 * @param {Object} props.opacity An Animated opacity.
 * @param {'start'|'end'} props.side
 */
function EdgeFade({ color, id, opacity, side }) {
  const start = side === 'start';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        start ? { right: undefined } : { left: undefined },
        { opacity, width: FADE_WIDTH },
      ]}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id={id} x1={start ? '0' : '1'} x2={start ? '1' : '0'} y1="0" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#${id})`} height="100%" width="100%" />
      </Svg>
    </Animated.View>
  );
}

EdgeFade.WIDTH = FADE_WIDTH;

export default EdgeFade;
