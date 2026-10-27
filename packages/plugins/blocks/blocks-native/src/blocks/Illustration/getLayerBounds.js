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

import getNodePoints from './getNodePoints.js';

function strokeOf(node) {
  if (type.isNone(node.props.stroke) || node.props.stroke === 'none') {
    return 0;
  }
  return type.isNumber(node.props.strokeWidth) ? node.props.strokeWidth : 1;
}

function widestStroke(nodes) {
  return nodes.reduce((widest, node) => {
    if (typeof node === 'string') return widest;
    return Math.max(widest, strokeOf(node), widestStroke(node.children));
  }, 0);
}

/**
 * The part of the viewBox a drawn layer (getLayers) draws in, so its SVG view is only that big: a
 * view's backing store is its size, and a drawing split into many layers would otherwise hold a
 * whole-drawing store for each. The bounds hold every point the layer's shapes name (a path's
 * control points included), half the widest stroke and a unit of margin, rounded out to whole
 * units and kept within the viewBox. Null, for the whole viewBox, when the layer has a transform,
 * an arc, text, an image, a use or a size it cannot read.
 *
 * @param {Object} params
 * @param {Object} params.layer A drawn layer, `{ ancestors, nodes }`.
 * @param {number[]} params.viewBox `[minX, minY, width, height]`.
 * @returns {number[]|null} `[x, y, width, height]` in the drawing's units, or null.
 */
function getLayerBounds({ layer, viewBox }) {
  if (layer.ancestors.some((ancestor) => !type.isNone(ancestor.props.transform))) {
    return null;
  }
  const points = [];
  for (const node of layer.nodes) {
    if (typeof node === 'string') continue;
    if (!type.isNone(node.props.transform)) return null;
    const found = getNodePoints({ node });
    if (found === null) return null;
    points.push(...found);
  }
  if (points.length === 0) {
    return null;
  }
  const pad = Math.max(...layer.ancestors.map(strokeOf), widestStroke(layer.nodes)) / 2 + 1;
  const [minX, minY, width, height] = viewBox;
  const left = Math.max(minX, Math.floor(Math.min(...points.map((point) => point[0])) - pad));
  const top = Math.max(minY, Math.floor(Math.min(...points.map((point) => point[1])) - pad));
  const right = Math.min(
    minX + width,
    Math.ceil(Math.max(...points.map((point) => point[0])) + pad)
  );
  const bottom = Math.min(
    minY + height,
    Math.ceil(Math.max(...points.map((point) => point[1])) + pad)
  );
  if (right <= left || bottom <= top) {
    return null;
  }
  return [left, top, right - left, bottom - top];
}

export default getLayerBounds;
