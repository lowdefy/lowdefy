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

import { parse } from 'react-native-svg';
import { type } from '@lowdefy/helpers';

// Elements that only define what others reference by id: every layer the drawing is split into
// draws them, so a reference resolves in each.
const DEFINITION_TAGS = new Set([
  'clipPath',
  'defs',
  'filter',
  'linearGradient',
  'marker',
  'mask',
  'pattern',
  'radialGradient',
  'symbol',
]);

function toNode(element) {
  if (typeof element === 'string') {
    return element;
  }
  return {
    children: element.children.map(toNode),
    props: element.props,
    tag: element.tag,
    Tag: element.Tag,
  };
}

function readViewBox(props) {
  if (type.isString(props.viewBox)) {
    const parts = props.viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
      return parts;
    }
  }
  if (type.isNumber(props.width) && type.isNumber(props.height)) {
    return [0, 0, props.width, props.height];
  }
  throw new Error(
    `Illustration svg needs a viewBox, or a numeric width and height. Received viewBox ${JSON.stringify(
      props.viewBox
    )}.`
  );
}

/**
 * Reads an Illustration's SVG markup with react-native-svg's parser into a tree of
 * `{ tag, Tag, props, children }` nodes, `Tag` being the react-native-svg component that draws
 * the element (attribute names camel-cased, numbers parsed).
 *
 * @param {Object} params
 * @param {string} params.svg The markup: one `<svg>` element with a viewBox.
 * @returns {{ viewBox: number[], definitions: Object[], nodes: Object[] }} The viewBox as
 *   `[minX, minY, width, height]`, the root's definition elements (defs, gradients, clip paths)
 *   and the root's other elements, in paint order.
 */
function parseIllustration({ svg }) {
  let root = null;
  parse(svg, (ast) => {
    root = toNode(ast);
    return ast;
  });
  if (root === null || root.tag !== 'svg') {
    throw new Error('Illustration svg must be one <svg> element.');
  }
  const elements = root.children.filter((child) => typeof child !== 'string');
  return {
    definitions: elements.filter((node) => DEFINITION_TAGS.has(node.tag)),
    nodes: elements.filter((node) => !DEFINITION_TAGS.has(node.tag)),
    viewBox: readViewBox(root.props),
  };
}

export default parseIllustration;
