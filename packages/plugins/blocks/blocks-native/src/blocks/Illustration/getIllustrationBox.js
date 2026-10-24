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

import { type } from '@lowdefy/helpers';

/**
 * Where an Illustration draws its viewBox in its box: scaled to fit whole and centred, as SVG's
 * default `xMidYMid meet`. A box with only a width or a height takes the other from the
 * viewBox's aspect ratio, and one with neither is the viewBox's size in points.
 *
 * @param {Object} params
 * @param {number[]} params.viewBox `[minX, minY, width, height]`.
 * @param {number} [params.width] The box width in points.
 * @param {number} [params.height] The box height in points.
 * @returns {{ width: number, height: number, scale: number, drawing: Object }} The box size,
 *   points per unit of the drawing, and the drawing's `{ left, top, width, height }` in the box.
 */
function getIllustrationBox({ height, viewBox, width }) {
  const [, , viewWidth, viewHeight] = viewBox;
  let boxWidth = width;
  let boxHeight = height;
  if (type.isNone(boxWidth) && type.isNone(boxHeight)) {
    boxWidth = viewWidth;
    boxHeight = viewHeight;
  } else if (type.isNone(boxHeight)) {
    boxHeight = (boxWidth * viewHeight) / viewWidth;
  } else if (type.isNone(boxWidth)) {
    boxWidth = (boxHeight * viewWidth) / viewHeight;
  }
  const scale = Math.min(boxWidth / viewWidth, boxHeight / viewHeight);
  const drawingWidth = viewWidth * scale;
  const drawingHeight = viewHeight * scale;
  return {
    drawing: {
      height: drawingHeight,
      left: (boxWidth - drawingWidth) / 2,
      top: (boxHeight - drawingHeight) / 2,
      width: drawingWidth,
    },
    height: boxHeight,
    scale,
    width: boxWidth,
  };
}

export default getIllustrationBox;
