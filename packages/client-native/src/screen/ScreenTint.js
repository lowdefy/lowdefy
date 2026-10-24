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

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Animated, Easing, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import getBackgroundTint from './getBackgroundTint.js';
import getTintStops from './getTintStops.js';
import useTheme from '../theme/useTheme.js';

const CROSS_FADE = 250;

function fade({ onDone, opacity, toValue }) {
  Animated.timing(opacity, {
    duration: CROSS_FADE,
    easing: Easing.inOut(Easing.quad),
    toValue,
    useNativeDriver: true,
  }).start(onDone);
}

function getTintKey(tint) {
  if (tint === null) return null;
  return `${tint.color} ${tint.opacity} ${tint.height}`;
}

function TintLayer({ gradientId, layer, screenHeight, testID }) {
  const { color, height, opacity } = layer.tint;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        height: screenHeight * height,
        left: 0,
        opacity: layer.opacity,
        position: 'absolute',
        right: 0,
        top: 0,
      }}
      testID={testID}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            {getTintStops({ opacity }).map((stop) => (
              <Stop
                key={stop.offset}
                offset={`${stop.offset}`}
                stopColor={color}
                stopOpacity={`${stop.opacity}`}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect fill={`url(#${gradientId})`} height="100%" width="100%" />
      </Svg>
    </Animated.View>
  );
}

// The tint layers shown: the current tint, over the ones it replaced while they fade out. A new
// tint fades in over 250ms as the one before fades out, and a tint that goes fades out. A tint
// set again with the same colour and height (a page tree mounting again) changes nothing.
function useTintLayers(tint) {
  const key = getTintKey(tint);
  const shownKey = useRef(null);
  const nextId = useRef(0);
  const layersRef = useRef([]);
  const [layers, setLayers] = useState([]);
  useEffect(() => {
    if (shownKey.current === key) return;
    shownKey.current = key;
    const leaving = layersRef.current;
    leaving.forEach((layer) => {
      fade({
        onDone: ({ finished }) => {
          if (!finished) return;
          layersRef.current = layersRef.current.filter((item) => item !== layer);
          setLayers(layersRef.current);
        },
        opacity: layer.opacity,
        toValue: 0,
      });
    });
    if (tint !== null) {
      const layer = { id: nextId.current, opacity: new Animated.Value(0), tint };
      nextId.current += 1;
      layersRef.current = [...leaving, layer];
      fade({ opacity: layer.opacity, toValue: 1 });
    }
    setLayers(layersRef.current);
  }, [key, tint]);
  return layers;
}

/**
 * A Screen's backgroundTint: a vertical gradient from the tint colour at the top of the screen
 * to clear at `height` of the screen height, drawn absolutely at the top of its parent. The page
 * draws it behind its scroll view, fixed to the screen, so it shows behind the large title,
 * through the translucent navigation bar and behind the content; a pinned headerBottom draws it
 * again in its surface over the bar. It cross-fades when the tint changes, and follows dark mode.
 *
 * @param {Object} props
 * @param {string} props.id A prefix for the gradient ids, unique on the page.
 * @param {Object} props.tint The page's tint store (createTintStore).
 */
function ScreenTint({ id, tint }) {
  const { isDark, tokens } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const backgroundTint = useSyncExternalStore(tint.subscribe, tint.get);
  const shown = getBackgroundTint({ backgroundTint, isDark, tokens });
  const layers = useTintLayers(shown);
  return layers.map((layer) => (
    <TintLayer
      gradientId={`${id}_${layer.id}`}
      key={layer.id}
      layer={layer}
      screenHeight={screenHeight}
      testID={`${id}_${layer.id}`}
    />
  ));
}

export default ScreenTint;
