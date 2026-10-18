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
import Svg from 'react-native-svg';

import renderIconNodes from './renderIconNodes.js';

// lucide-react's svg attributes, which the web draws every icon with. A set that draws another
// way (filled icons) gives its own in IconData.attrs, which win.
const DEFAULT_ATTRS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
  viewBox: '0 0 24 24',
};

/**
 * Draws an icon from its IconData, the same data the web draws: `{ node, attrs?, size?, width?,
 * height? }`, `node` being `[tag, attrs, children?]` entries. The build gives it in the mobile
 * root (menu icons) and page config. Blocks and the shell draw every icon through this.
 *
 * @param {Object} props
 * @param {Object} props.data The icon's IconData.
 * @param {string} [props.color] The colour `currentColor` draws with.
 * @param {number} [props.size] Width and height; the icon's own size, or 24.
 * @param {number} [props.strokeWidth]
 * @param {Object} [props.style]
 * @param {string} [props.testID]
 */
function Icon({ color, data, size, strokeWidth, style, testID }) {
  const { height, width, ...attrs } = { ...DEFAULT_ATTRS, ...data.attrs };
  const iconSize = size ?? data.size;
  return (
    <Svg
      {...attrs}
      color={color}
      height={iconSize ?? data.height ?? height ?? 24}
      strokeWidth={strokeWidth ?? attrs.strokeWidth}
      style={style}
      testID={testID}
      width={iconSize ?? data.width ?? width ?? 24}
    >
      {renderIconNodes(data.node)}
    </Svg>
  );
}

export default Icon;
