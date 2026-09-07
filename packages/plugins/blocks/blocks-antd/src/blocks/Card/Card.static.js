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
 * Card → a `stack`. The card header comes first: the `title` area's blocks
 * when the page fills it, else `properties.title` as a level-4 heading (the
 * same precedence Card.js applies). Then the `extra` area (rendered in the
 * header on the page), the `cover`, and the `content` body. An empty,
 * untitled card yields no node.
 */
export const Card = {
  toReport: ({ block, areas = {} }) => {
    const nodes = [];
    const { title } = block.properties;
    if ((areas.title ?? []).length > 0) {
      nodes.push(...areas.title);
    } else if (!isBlank(title)) {
      nodes.push({ kind: 'heading', text: htmlToText(title), level: 4 });
    }
    nodes.push(...(areas.extra ?? []), ...(areas.cover ?? []), ...(areas.content ?? []));
    if (nodes.length === 0) return null;
    return { kind: 'stack', children: nodes };
  },
};
