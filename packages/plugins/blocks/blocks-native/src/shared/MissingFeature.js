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
import { Text, View } from 'react-native';
import { useTheme } from '@lowdefy/client-native';

import { FEATURE_SHELLS } from '../device/getDeviceFeature.js';

// What a block that draws a device view (a camera, a map) shows in a shell without the feature:
// a plain box naming the profile or extension that carries it.
function MissingFeature({ blockId, feature, height, style, title }) {
  const { tokens } = useTheme();
  return (
    <View
      style={[
        {
          alignItems: 'center',
          backgroundColor: tokens.colorTertiarySystemFill,
          borderRadius: 12,
          height,
          justifyContent: 'center',
          padding: 16,
        },
        style,
      ]}
      testID={`${blockId}_missing`}
    >
      <Text style={{ color: tokens.colorSecondaryLabel, textAlign: 'center' }}>
        {`${title} needs a shell that carries ${feature} (${FEATURE_SHELLS[feature]}).`}
      </Text>
    </View>
  );
}

export default MissingFeature;
