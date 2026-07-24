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

import { isBlank } from './utils.js';

/**
 * Span → `text`. The Span block shows `properties.content` when set, otherwise
 * its child content area; the report mirrors that precedence — `content` wins,
 * else the walked children are wrapped in a `text`-led stack. A Span with
 * neither a content string nor children yields no node.
 */
export const Span = {
  toReport: ({ block, children }) => {
    const content = block.properties?.content;
    if (!isBlank(content)) return { kind: 'text', text: String(content) };
    const nodes = children ?? [];
    if (nodes.length === 0) return null;
    return { kind: 'stack', children: nodes };
  },
};
