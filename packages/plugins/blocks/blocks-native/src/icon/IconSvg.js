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
 * One icon's data drawn as an svg, with lucide's defaults (a 24 unit grid, round stroked lines in
 * the current colour) under the data's own attributes, so a filled set's `fill` wins.
 *
 * @param {Object} props
 * @param {string} props.color The colour `currentColor` draws with.
 * @param {{ node: Array, attrs?: Object, size?: number, width?: number, height?: number }} props.data
 * @param {boolean} props.nonScalingStroke Keep the stroke width at any size.
 * @param {number} props.size The icon's width and height in points.
 * @param {number} props.strokeWidth
 */
function IconSvg({ color, data, nonScalingStroke, size, strokeWidth }) {
  const viewWidth = data.width ?? data.size ?? DEFAULT_VIEW_SIZE;
  const viewHeight = data.height ?? data.size ?? DEFAULT_VIEW_SIZE;
  return (
    <Svg
      color={color}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={size}
      {...data.attrs}
    >
      {renderIconNodes({ node: data.node, nonScalingStroke })}
    </Svg>
  );
}

export default IconSvg;
