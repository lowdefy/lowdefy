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

import { getTrace } from '@lowdefy/engine';

// A block as the trace describes an element on the web (engine trace describeElement), for a
// host with no DOM: the block id is the element. Text, row, column and nth stay null, since a
// native block has no DOM text or table cells to read them from.
function describeBlock({ blockId, lowdefy }) {
  const trace = getTrace(lowdefy);
  const entry = trace.pathEntryOf(lowdefy._internal.globals.window.location.href);
  const block =
    lowdefy.contexts[entry?.instanceKey]?._internal.RootSlots.map[blockId] ??
    lowdefy.appContext?._internal.RootSlots.map[blockId];
  return {
    page_id: entry?.pageId ?? null,
    block_id: blockId,
    block_type: block?.type ?? null,
    row: null,
    column: null,
    text: null,
    nth: null,
    option: false,
    block_ids: [blockId],
  };
}

export default describeBlock;
