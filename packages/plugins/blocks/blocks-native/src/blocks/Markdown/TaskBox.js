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
import Svg, { Path } from 'react-native-svg';

const SIZE = 18;

/**
 * A task list item's box, drawn where the item's marker goes: an empty rounded square, or the
 * tint filled with a check once the task is done.
 *
 * @param {Object} props
 * @param {boolean} props.checked
 * @param {Object} props.palette The Markdown's palette (getMarkdownStyles).
 */
function TaskBox({ checked, palette }) {
  return (
    <View
      accessibilityLabel={checked ? 'Done' : 'Not done'}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={{
        alignItems: 'center',
        backgroundColor: checked ? palette.tint : 'transparent',
        borderColor: checked ? palette.tint : palette.secondaryLabel,
        borderRadius: 5,
        borderWidth: 1.5,
        height: SIZE,
        justifyContent: 'center',
        marginTop: (palette.text.lineHeight - SIZE) / 2,
        width: SIZE,
      }}
      testID={checked ? 'markdown-task-done' : 'markdown-task-open'}
    >
      {checked ? (
        <Svg height={12} viewBox="0 0 12 12" width={12}>
          <Path
            d="M2.5 6.2l2.3 2.3 4.7-5"
            fill="none"
            stroke={palette.tokens.colorTextLightSolid ?? '#FFFFFF'}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
          />
        </Svg>
      ) : null}
    </View>
  );
}

export default TaskBox;
