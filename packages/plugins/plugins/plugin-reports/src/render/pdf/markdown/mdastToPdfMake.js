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

import blockNodes from './blockNodes.js';
import collectDefinitions from './collectDefinitions.js';

/**
 * Map an mdast tree to pdfmake content. Pure: no logger, no I/O, no mutation of
 * the inputs, so the mapping is tested at the object level with no PDF bytes.
 *
 * @param {object} tree An mdast root (from parseMarkdown).
 * @param {object} [options] contentWidth (points, sizes rules and caps image
 *   widths) and images (markdown image url -> base64 data URL, from the
 *   resolution pre-pass).
 * @returns {{ content: object[], htmlNodes: number }} the pdfmake content nodes
 *   and how many raw-HTML nodes were ignored.
 */
function mdastToPdfMake(tree, { contentWidth, images } = {}) {
  const state = {
    contentWidth,
    images: images ?? {},
    definitions: collectDefinitions(tree),
    listDepth: 0,
    htmlNodes: 0,
  };
  const content = blockNodes(tree?.children, state);
  return { content, htmlNodes: state.htmlNodes };
}

export default mdastToPdfMake;
