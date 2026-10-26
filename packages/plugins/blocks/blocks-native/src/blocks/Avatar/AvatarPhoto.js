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
import { Animated, Easing, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const FADE_MS = 220;

/**
 * An avatar's photo over its initials, loaded and cached (in memory and on disk) by expo-image.
 * It fades in once it has loaded, except from the memory cache, so rows scrolled back into view
 * do not flicker. Give it a `key` of its url, so a new picture starts hidden again.
 *
 * @param {Object} props
 * @param {Function} props.onError Called when the image fails to load.
 * @param {Function} props.onShown Called once the image covers the initials.
 * @param {number} props.size
 * @param {{ uri: string, headers?: Object }} props.source
 */
function AvatarPhoto({ onError, onShown, size, source }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const onLoad = ({ cacheType }) => {
    if (cacheType === 'memory') {
      opacity.setValue(1);
      onShown();
      return;
    }
    Animated.timing(opacity, {
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onShown();
    });
  };
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image
        accessibilityIgnoresInvertColors
        cachePolicy="memory-disk"
        contentFit="cover"
        onError={onError}
        onLoad={onLoad}
        recyclingKey={source.uri}
        source={source}
        style={{ height: size, width: size }}
      />
    </Animated.View>
  );
}

export default AvatarPhoto;
