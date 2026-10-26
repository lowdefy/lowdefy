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

// A stand-in for expo-image's Image, whose view needs a native module Jest does not have. It keeps
// its props, so a test reads the source and fires the load and error events:
// fireEvent(image, 'load', { cacheType: 'none' }) or fireEvent(image, 'error', { error: '' }).
function Image({
  accessibilityLabel,
  accessible,
  cachePolicy,
  contentFit,
  onError,
  onLoad,
  recyclingKey,
  source,
  style,
  testID,
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible={accessible}
      cachePolicy={cachePolicy}
      contentFit={contentFit}
      onError={onError}
      onLoad={onLoad}
      recyclingKey={recyclingKey}
      source={source}
      style={style}
      testID={testID ?? 'expo-image'}
    />
  );
}

export { Image };
