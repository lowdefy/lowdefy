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

const PATH_TOKENS = /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
const PARAMETER_COUNTS = { C: 6, H: 1, L: 2, M: 2, Q: 4, S: 4, T: 2, V: 1, Z: 0 };

// Every point a path's commands name, control points included, which hold the drawn curve: null
// for an arc, whose bulge its points do not hold.
function pathPoints(d) {
  const tokens = d.match(PATH_TOKENS) ?? [];
  const points = [];
  let command = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let index = 0;
  while (index < tokens.length) {
    if (/[A-Za-z]/.test(tokens[index])) {
      command = tokens[index];
      index += 1;
    }
    const upper = command?.toUpperCase();
    if (upper === 'A' || PARAMETER_COUNTS[upper] === undefined) {
      return null;
    }
    const relative = command !== upper;
    const values = tokens.slice(index, index + PARAMETER_COUNTS[upper]).map(Number);
    index += PARAMETER_COUNTS[upper];
    if (upper === 'Z') {
      x = startX;
      y = startY;
      continue;
    }
    if (values.length < PARAMETER_COUNTS[upper] || values.some(Number.isNaN)) {
      return null;
    }
    if (upper === 'H') {
      x = relative ? x + values[0] : values[0];
    } else if (upper === 'V') {
      y = relative ? y + values[0] : values[0];
    } else {
      const originX = x;
      const originY = y;
      for (let pair = 0; pair < values.length; pair += 2) {
        const pointX = relative ? originX + values[pair] : values[pair];
        const pointY = relative ? originY + values[pair + 1] : values[pair + 1];
        points.push([pointX, pointY]);
        x = pointX;
        y = pointY;
      }
    }
    points.push([x, y]);
    if (upper === 'M') {
      startX = x;
      startY = y;
      // Pairs after a move's first are lines.
      command = relative ? 'l' : 'L';
    }
  }
  return points;
}

function numbers(props, keys) {
  const values = keys.map((key) => props[key] ?? 0);
  return values.every(type.isNumber) ? values : null;
}

function nodePoints(node) {
  const { props } = node;
  switch (node.tag) {
    case 'path':
      return type.isString(props.d) ? pathPoints(props.d) : null;
    case 'rect': {
      const values = numbers(props, ['x', 'y', 'width', 'height']);
      if (values === null) return null;
      const [x, y, width, height] = values;
      return [
        [x, y],
        [x + width, y + height],
      ];
    }
    case 'circle':
    case 'ellipse': {
      const values =
        node.tag === 'circle'
          ? numbers(props, ['cx', 'cy', 'r', 'r'])
          : numbers(props, ['cx', 'cy', 'rx', 'ry']);
      if (values === null) return null;
      const [cx, cy, rx, ry] = values;
      return [
        [cx - rx, cy - ry],
        [cx + rx, cy + ry],
      ];
    }
    case 'line': {
      const values = numbers(props, ['x1', 'y1', 'x2', 'y2']);
      if (values === null) return null;
      return [
        [values[0], values[1]],
        [values[2], values[3]],
      ];
    }
    case 'polygon':
    case 'polyline': {
      const values = `${props.points ?? ''}`
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (values.length < 2 || values.some(Number.isNaN)) return null;
      const points = [];
      for (let pair = 0; pair + 1 < values.length; pair += 2) {
        points.push([values[pair], values[pair + 1]]);
      }
      return points;
    }
    case 'g':
      return childPoints(node.children);
    default:
      return null;
  }
}

function childPoints(nodes) {
  const points = [];
  for (const node of nodes) {
    if (typeof node === 'string') continue;
    if (!type.isNone(node.props.transform)) return null;
    const found = nodePoints(node);
    if (found === null) return null;
    points.push(...found);
  }
  return points;
}

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
  const points = childPoints(layer.nodes);
  if (points === null || points.length === 0) {
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
