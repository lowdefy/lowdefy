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

/**
 * Every point a parsed element names, in its own coordinates (before its own transform): a path's
 * points, control points included, which hold the drawn curve; a shape's corners; a group's
 * children's points. Null when the element's extent cannot be read from its points: an arc, text,
 * an image, a use, a size in percent, or a child with a transform of its own.
 *
 * @param {Object} params
 * @param {Object} params.node A parsed element (parseIllustration).
 * @returns {number[][]|null} `[[x, y], ...]`, or null.
 */
function getNodePoints({ node }) {
  return nodePoints(node);
}

export default getNodePoints;
