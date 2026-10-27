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

import { Defs } from 'react-native-svg';
import { type } from '@lowdefy/helpers';

import getNodePoints from './getNodePoints.js';

const URL_REFERENCE = /^url\(#([^)]+)\)$/;
const SHAPES = new Set(['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect']);
// Path commands whose points are the path's extent: lines only, no curves or arcs.
const CURVES = /[AaCcQqSsTt]/;

function findGradients({ found = {}, nodes }) {
  nodes.forEach((node) => {
    if (typeof node === 'string') return;
    if (node.tag === 'linearGradient' && type.isString(node.props.id)) {
      found[node.props.id] = node;
    }
    findGradients({ found, nodes: node.children });
  });
  return found;
}

// A user-space gradient along an axis, with its ends given as numbers, maps exactly onto any
// element's bounding box; a slanted one would skew in a box that is not square.
function isConvertible(gradient) {
  const { gradientTransform, gradientUnits, x1, x2, y1, y2 } = gradient.props;
  if (gradientUnits !== 'userSpaceOnUse' || !type.isNone(gradientTransform)) {
    return false;
  }
  if (![x1, x2, y1, y2].every(type.isNumber)) {
    return false;
  }
  return x1 === x2 || y1 === y2;
}

// The element's extent, when its points are exactly its bounding box.
function boundsOf(node) {
  if (!SHAPES.has(node.tag)) return null;
  if (node.tag === 'path' && (!type.isString(node.props.d) || CURVES.test(node.props.d))) {
    return null;
  }
  const points = getNodePoints({ node });
  if (points === null || points.length === 0) return null;
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const width = Math.max(...xs) - left;
  const height = Math.max(...ys) - top;
  if (width <= 0 || height <= 0) return null;
  return [left, top, width, height];
}

/**
 * Redraws user-space linear gradients as bounding-box ones. react-native-svg on iOS does not
 * place a `gradientUnits="userSpaceOnUse"` gradient in the drawing's coordinates, so a fade
 * drawn that way lands in the wrong place, or not at all. An element whose fill or stroke (its
 * own, or a group's it inherits) is such a gradient gets a copy of it in its own bounding box
 * (`objectBoundingBox`, the default units, which every platform draws), its ends moved into the
 * box: the same fade in the same place. Gradients along an axis on shapes with straight edges
 * are converted, which keeps the result exact; others are left as they are.
 *
 * @param {Object} params
 * @param {Object[]} params.definitions The drawing's definitions, coloured.
 * @param {Array} params.nodes The drawing's elements, coloured.
 * @returns {{ definitions: Object[], nodes: Array }} The definitions with the bounding-box copies
 *   in a defs element after them, and the elements that use them.
 */
function toBoundingBoxGradients({ definitions, nodes }) {
  const gradients = findGradients({ nodes: [...definitions, ...nodes] });
  const copies = new Map();

  function copyFor({ bounds, gradient }) {
    const key = `${gradient.props.id}|${bounds.join(' ')}`;
    if (!copies.has(key)) {
      const [left, top, width, height] = bounds;
      const { x1, x2, y1, y2 } = gradient.props;
      copies.set(key, {
        ...gradient,
        props: {
          ...gradient.props,
          gradientUnits: 'objectBoundingBox',
          id: `${gradient.props.id}-box-${copies.size}`,
          x1: (x1 - left) / width,
          x2: (x2 - left) / width,
          y1: (y1 - top) / height,
          y2: (y2 - top) / height,
        },
      });
    }
    return `url(#${copies.get(key).props.id})`;
  }

  function convertible(paint) {
    if (!type.isString(paint)) return null;
    const match = paint.match(URL_REFERENCE);
    const gradient = match ? gradients[match[1]] : undefined;
    return gradient !== undefined && isConvertible(gradient) ? gradient : null;
  }

  function convert({ inherited, node }) {
    if (typeof node === 'string') return node;
    const paint = {
      fill: node.props.fill ?? inherited.fill,
      stroke: node.props.stroke ?? inherited.stroke,
    };
    const props = { ...node.props };
    if (SHAPES.has(node.tag)) {
      ['fill', 'stroke'].forEach((key) => {
        const gradient = convertible(paint[key]);
        const bounds = gradient === null ? null : boundsOf(node);
        if (bounds !== null) props[key] = copyFor({ bounds, gradient });
      });
    }
    return {
      ...node,
      children: node.children.map((child) => convert({ inherited: paint, node: child })),
      props,
    };
  }

  const converted = nodes.map((node) => convert({ inherited: {}, node }));
  if (copies.size === 0) {
    return { definitions, nodes };
  }
  return {
    definitions: [
      ...definitions,
      { children: [...copies.values()], props: {}, tag: 'defs', Tag: Defs },
    ],
    nodes: converted,
  };
}

export default toBoundingBoxGradients;
