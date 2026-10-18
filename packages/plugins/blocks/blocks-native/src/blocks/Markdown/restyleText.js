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
import { Text } from 'react-native';

/**
 * Rendered markdown text with a style laid over every Text in it, nested ones too: the renderer
 * gives each part of a line its own full text style, so a table cell's size or a header's weight
 * has to reach each part. Views inside the text, such as link chips, keep their own styles.
 *
 * @param {React.ReactNode} node
 * @param {Object} style
 * @returns {React.ReactNode}
 */
function restyleText(node, style) {
  if (Array.isArray(node)) {
    return node.map((child) => restyleText(child, style));
  }
  if (!React.isValidElement(node) || node.type !== Text) {
    return node;
  }
  return React.cloneElement(node, {
    children: restyleText(node.props.children, style),
    style: [node.props.style, style],
  });
}

export default restyleText;
