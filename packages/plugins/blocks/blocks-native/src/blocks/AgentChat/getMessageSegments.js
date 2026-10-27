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

import { partCategory } from './messageParts.js';

const GROUPED_ORDER = ['reasoning', 'tool', 'file', 'status', 'text'];

function isShown({ category, config }) {
  if (category === 'reasoning') return config?.showReasoning !== false;
  if (category === 'tool') return config?.showThoughtChain !== false;
  if (category === 'status') return config?.showStatusUpdates !== false;
  return true;
}

/**
 * An assistant message's parts as the runs the message draws, as the web block's MessageBubble
 * groups them: consecutive parts of one kind (reasoning, tool calls, files, status updates, text)
 * make a segment, in the order the agent sent them (`reasoningDisplay: interleaved`, the default),
 * or one segment of each kind in a fixed order (`grouped`). Parts that draw nothing (step starts,
 * sources, custom data parts) are left out, so they do not split a run, and so are the kinds the
 * messageDisplay hides.
 *
 * @param {Object} params
 * @param {Object} [params.config] The messageDisplay property.
 * @param {Object[]} params.parts
 * @returns {{ category: string, key: string, parts: Object[] }[]}
 */
function getMessageSegments({ config, parts }) {
  const shownParts = (parts ?? [])
    .map((part) => ({ part, category: partCategory(part) }))
    .filter(({ category }) => category !== null && isShown({ category, config }));
  if (config?.reasoningDisplay === 'grouped') {
    return GROUPED_ORDER.map((category) => ({
      category,
      key: category,
      parts: shownParts.filter((entry) => entry.category === category).map(({ part }) => part),
    })).filter((segment) => segment.parts.length > 0);
  }
  const segments = [];
  shownParts.forEach(({ category, part }) => {
    const last = segments[segments.length - 1];
    if (last?.category === category) {
      last.parts.push(part);
      return;
    }
    segments.push({ category, key: `${category}-${segments.length}`, parts: [part] });
  });
  return segments;
}

export default getMessageSegments;
