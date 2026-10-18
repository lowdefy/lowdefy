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
import Svg, { Circle } from 'react-native-svg';

/**
 * The avatar of a picker row that stands for no value, such as "Unassigned": an empty dashed
 * circle in the tertiary label colour, as Linear and GitHub draw nobody.
 *
 * @param {Object} props
 * @param {string} props.color
 * @param {number} props.size
 * @param {string} [props.testID]
 */
function NoValueAvatar({ color, size, testID }) {
  const strokeWidth = 1.5;
  return (
    <Svg height={size} testID={testID} viewBox={`0 0 ${size} ${size}`} width={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={(size - strokeWidth) / 2}
        stroke={color}
        strokeDasharray="3 2.5"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export default NoValueAvatar;
