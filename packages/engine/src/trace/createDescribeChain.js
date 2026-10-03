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

import { targetFromElementsChain } from '@lowdefy/helpers';

// The journey target a posthog-js `$elements_chain` describes as, for the PostHog before_send
// hook, which holds the chain but not the element. The chain carries no sibling text, so nth is
// always null.
function createDescribeChain({ findBlockType, pageIdOf }) {
  return function describeChain(elementsChain) {
    const { block_id, row, column, text, option, block_ids } =
      targetFromElementsChain(elementsChain);
    const pageId = pageIdOf(window.location.href);
    return {
      page_id: pageId,
      block_id,
      block_type: findBlockType({ blockId: block_id, pageId }),
      row,
      column,
      text,
      nth: null,
      option,
      block_ids,
    };
  };
}

export default createDescribeChain;
