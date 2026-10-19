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

/**
 * The text of rendered markdown nodes: a link's children are its text, or the Text elements its
 * parts were drawn as (escaped characters and emphasis split a title into several).
 *
 * @param {React.ReactNode} node
 * @returns {string}
 */
function getNodeText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  if (React.isValidElement(node)) {
    return getNodeText(node.props.children);
  }
  return '';
}

export default getNodeText;
