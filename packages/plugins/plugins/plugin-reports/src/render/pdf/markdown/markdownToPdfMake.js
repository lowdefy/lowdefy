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

import mdastToPdfMake from './mdastToPdfMake.js';
import parseMarkdown from './parseMarkdown.js';

/**
 * Translate a markdown IR node to a single pdfmake node (a stack of the mapped
 * blocks), or null when the markdown renders nothing.
 *
 * @param {object} node A markdown IR node; tree and images are present when the
 *   pre-pass ran, and the source is parsed here otherwise.
 * @param {object} [ctx] contentWidth (points) and logger.
 * @returns {object|null} a pdfmake node, or null for empty markdown.
 */
function markdownToPdfMake(node, ctx = {}) {
  const tree = node.tree ?? parseMarkdown(node.markdown);
  const { content, htmlNodes } = mdastToPdfMake(tree, {
    contentWidth: ctx.contentWidth,
    images: node.images,
  });
  if (htmlNodes > 0) {
    // One warning per markdown node, not per html node, naming the count.
    ctx.logger?.warn?.(
      { htmlNodes },
      `Report markdown: ${htmlNodes} raw HTML node(s) ignored. ` +
        'Markdown in a report renders markdown only. Use an Html block for custom HTML.'
    );
  }
  if (content.length === 0) return null;
  return { stack: content };
}

export default markdownToPdfMake;
