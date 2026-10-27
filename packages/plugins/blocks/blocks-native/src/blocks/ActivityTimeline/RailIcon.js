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

/** An event's icon on the rail: the glyph in its tone's colour, on a small filled circle. */
function RailIcon({ color, colors, Icon, name, size = 24 }) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.fill,
        borderRadius: size / 2,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      <Icon
        properties={{ name, size: Math.round(size * 0.55), strokeWidth: 2.25, title: '' }}
        styles={{ element: { color } }}
      />
    </View>
  );
}

export default RailIcon;
