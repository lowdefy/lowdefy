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

import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';

// Unlike the other id checks, a duplicate block id is collected instead of
// thrown: the block build continues (the id counter still makes the artifact id
// unique), so every other check on the page reports in the same build.
function createCheckDuplicateBlockId({ context, pageId }) {
  const seen = new Set();
  return function checkDuplicateBlockId({ id, configKey }) {
    const key = id.toLowerCase();
    if (seen.has(key)) {
      collectExceptions(
        context,
        new ConfigError(
          `Duplicate blockId "${id}" on page "${pageId}". Block ids are the page state keys, so two blocks with one id share a single state value. Rename one of them.`,
          { configKey, checkSlug: 'duplicate-block-id' }
        )
      );
      return;
    }
    seen.add(key);
  };
}

export default createCheckDuplicateBlockId;
