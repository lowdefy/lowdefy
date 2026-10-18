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

const VARIABLE = /var\(\s*--([\w-]+)\s*(?:,\s*([^)]*?)\s*)?\)/g;

function colorValue({ colors, value }) {
  if (!type.isString(value) || !value.includes('var(')) {
    return value;
  }
  return value.replace(VARIABLE, (match, name, fallback) => {
    if (type.isString(colors[name])) {
      return colors[name];
    }
    if (type.isString(fallback) && fallback !== '') {
      return fallback;
    }
    throw new Error(
      `Illustration svg uses var(--${name}), which is not in colors or the theme tokens.`
    );
  });
}

function colorProps({ colors, props }) {
  const colored = {};
  Object.keys(props).forEach((key) => {
    const value = props[key];
    colored[key] = type.isObject(value)
      ? colorProps({ colors, props: value })
      : colorValue({ colors, value });
  });
  return colored;
}

/**
 * The drawing's nodes with each `var(--name)` in an attribute (or a style declaration) replaced
 * by the colour of that name, as CSS custom properties are: `var(--name, fallback)` takes the
 * fallback for a name with no colour. A name with no colour and no fallback is an error.
 *
 * @param {Object} params
 * @param {Object} params.colors Colours by name, for the mode showing.
 * @param {Array} params.nodes The parsed nodes (parseIllustration).
 * @returns {Array} New nodes; text children are kept.
 */
function colorNodes({ colors, nodes }) {
  return nodes.map((node) => {
    if (typeof node === 'string') {
      return node;
    }
    return {
      ...node,
      children: colorNodes({ colors, nodes: node.children }),
      props: colorProps({ colors, props: node.props }),
    };
  });
}

export default colorNodes;
