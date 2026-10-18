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

const DEFAULT_VIEW_SIZE = 24;

/**
 * Draws an icon from its IconData, the same data the web draws: `{ node, attrs?, size?, width?,
 * height? }`, `node` being `[tag, attrs, children?]` entries. lucide-react's svg defaults (a 24
 * unit grid, round stroked lines in the current colour) sit under the data's own attributes, so
 * a filled set's `fill` wins. The shell draws menu icons with it, and the `components.Icon` that
 * blocks draw through (createIcon) draws with it.
 *
 * @param {Object} props
 * @param {Object} props.data The icon's IconData.
 * @param {string} [props.color] The colour `currentColor` draws with.
 * @param {boolean} [props.nonScalingStroke] Keep the stroke width at any size.
 * @param {number} [props.size] Width and height; the icon's own size, or 24.
 * @param {number} [props.strokeWidth]
 * @param {Object} [props.style]
 * @param {string} [props.testID]
 */
function Icon({ color, data, nonScalingStroke = false, size, strokeWidth = 2, style, testID }) {
  // An svg width or height in the data is the view size, not the drawn size: size wins.
  const { height, width, ...attrs } = data.attrs ?? {};
  const viewWidth = data.width ?? data.size ?? width ?? DEFAULT_VIEW_SIZE;
  const viewHeight = data.height ?? data.size ?? height ?? DEFAULT_VIEW_SIZE;
  return (
    <Svg
      color={color}
      fill="none"
      height={size ?? viewHeight}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      style={style}
      testID={testID}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={size ?? viewWidth}
      {...attrs}
    >
      {renderIconNodes({ node: data.node, nonScalingStroke })}
    </Svg>
  );
}

export default Icon;
