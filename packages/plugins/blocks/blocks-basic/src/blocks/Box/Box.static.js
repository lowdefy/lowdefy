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

import { htmlToText, isBlank } from '@lowdefy/block-utils/report';

/**
 * Box → a `stack` of its `content` area. The Box block shows
 * `properties.content` when set instead of its child area, so the report
 * mirrors that: a content string becomes a single `text` (markup flattened),
 * otherwise the walked area passes through as a stack. An empty, content-less
 * box yields no node.
 */
export const Box = {
  toReport: ({ block, areas = {} }) => {
    const content = block.properties?.content;
    if (!isBlank(content)) return { kind: 'text', text: htmlToText(content) };
    const nodes = areas.content ?? [];
    if (nodes.length === 0) return null;
    return { kind: 'stack', children: nodes };
  },
};
