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
import { ActivityIndicator, View } from 'react-native';
import { type } from '@lowdefy/helpers';
import { useTheme } from '@lowdefy/client-native';

import meta from './meta.js';

// The platform's small indicator is 20 points on both iOS and Android.
const INDICATOR_SIZE = 20;

function getSize(size) {
  if (type.isNumber(size)) return size;
  switch (size) {
    case undefined:
    case 'small':
      return 20;
    case 'large':
      return 32;
    default:
      return 24;
  }
}

// The platform's activity indicator at the web Spinner's sizes, in the secondary label colour iOS
// draws it in. iOS draws an indicator only small or large, so other sizes scale the small one.
function Spinner({ blockId, properties, styles = {} }) {
  const { tokens } = useTheme();
  const size = getSize(properties.size);
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={[{ alignItems: 'center', height: size, justifyContent: 'center' }, styles.element]}
    >
      <ActivityIndicator
        color={tokens.colorSecondaryLabel}
        size="small"
        style={{ transform: [{ scale: size / INDICATOR_SIZE }] }}
        testID={`${blockId}_indicator`}
      />
    </View>
  );
}

Spinner.meta = meta;

export default Spinner;
