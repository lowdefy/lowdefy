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

import { ConfigWarning } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// List item blocks are configured as "list.$.field"; a CallMethod from outside the list names a
// concrete row ("list.0.field"), which resolves to the same configured block.
function toBlockIdPattern(blockId) {
  return blockId.replace(/\.\d+(?=\.|$)/g, '.$');
}

function validateCallMethodReferences({
  blockIds,
  callMethodActionRefs,
  hasDynamicBlocks,
  pageId,
  context,
}) {
  // Dynamic blocks add blocks at runtime, so the build cannot know every block id on the page.
  if (hasDynamicBlocks) return;
  const knownBlockIds = new Set(blockIds);

  callMethodActionRefs.forEach(({ targetBlockId, action }) => {
    if (action.skip === true || type.isObject(action.skip)) {
      return;
    }
    if (knownBlockIds.has(targetBlockId) || knownBlockIds.has(toBlockIdPattern(targetBlockId))) {
      return;
    }
    context.handleWarning(
      new ConfigWarning(
        `CallMethod targets block "${targetBlockId}", which is not defined on page "${pageId}". ` +
          `Check the blockId for typos, or add a block with id "${targetBlockId}" to page "${pageId}".`,
        {
          configKey: action['~k'],
          prodError: true,
          checkSlug: 'callmethod-refs',
        }
      )
    );
  });
}

export default validateCallMethodReferences;
