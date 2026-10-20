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

import getMatcherParams from './getMatcherParams.js';

// A typo in a block id matches nothing, so the action would succeed having done nothing. regex and
// blockIds: true never warn, and neither does a "$" id outside a list row: it names no row.
function warnUnmatchedBlockIds({ action, arrayIndices, context, params }) {
  const blockIds = getMatcherParams({ params, arrayIndices })?.blockIds;
  if (!type.isArray(blockIds)) return;
  const { map } = context._internal.RootSlots;
  new Set(blockIds).forEach((blockId) => {
    if (map[blockId]) return;
    if (type.isString(blockId) && blockId.includes('$')) return;
    context._internal.lowdefy._internal.logger.warn(
      `${action}: No block with id "${blockId}" on page "${context.pageId}". The action matched nothing for this id.`
    );
  });
}

export default warnUnmatchedBlockIds;
