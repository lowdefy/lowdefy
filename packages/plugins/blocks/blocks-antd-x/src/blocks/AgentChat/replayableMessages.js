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

// A reply cut off mid-stream leaves its tool call with no result, and UIMessage validation
// rejects the whole history for one such part: every later send fails, and a history stored
// that way fails on every load. Approval states stay; a pending approval is answerable on resume.
// A client-side tool the block is still running is in the same state, so its call id is in
// liveToolCallIds and the part is kept: its output is on the way.
const UNANSWERED = new Set(['input-streaming', 'input-available']);

function isDeadToolPart({ part, liveToolCallIds }) {
  const partType = part?.type;
  const isTool =
    partType === 'dynamic-tool' || (type.isString(partType) && partType.startsWith('tool-'));
  return isTool && UNANSWERED.has(part.state) && !liveToolCallIds.has(part.toolCallId);
}

function replayableMessages({ messages, liveToolCallIds = new Set() }) {
  const list = messages ?? [];
  let changed = false;
  const result = [];
  for (const message of list) {
    if (!type.isArray(message?.parts)) {
      result.push(message);
      continue;
    }
    const parts = message.parts.filter((part) => !isDeadToolPart({ part, liveToolCallIds }));
    // Only a step marker left is the empty shell onError already drops.
    if (!parts.some((part) => part?.type !== 'step-start')) {
      changed = true;
      continue;
    }
    if (parts.length === message.parts.length) {
      result.push(message);
      continue;
    }
    changed = true;
    result.push({ ...message, parts });
  }
  return changed ? result : list;
}

export default replayableMessages;
