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
import { Pressable, Text, View } from 'react-native';
import { Box as meta } from '@lowdefy/blocks-native/metas';

// A plain container until @lowdefy/blocks-native brings its native blocks. The engine runs a
// page's app events on a Box, so no page renders without one.
function Box({ blockId, content, events, methods, properties }) {
  const children =
    typeof properties.content === 'string' ? (
      <Text>{properties.content}</Text>
    ) : (
      content.content?.()
    );
  if (events.onClick) {
    return (
      <Pressable
        onPress={() => methods.triggerEvent({ name: 'onClick' })}
        testID={`${blockId}-press`}
      >
        {children}
      </Pressable>
    );
  }
  return <View>{children}</View>;
}

Box.meta = meta;

export default Box;
