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

function failedEvents({ record }) {
  return [record.event, ...(record.also ?? [])].filter(
    (event) => type.isObject(event) && event.success === false
  );
}

// Every failed event in the records, in order, as the production profile and
// coverage key failure paths: page, block, event and the invalid blocks a
// Validate named (sorted). An app event has no page block, so it is keyed
// `app.<event>`. `interaction` says whether an interaction caused it, in
// which case a segment's journey ends at that interaction's step.
function listFailurePaths({ records }) {
  return records.flatMap((record) =>
    failedEvents({ record }).map((event) => {
      const invalidBlocks = [...(event.invalid_blocks ?? [])].sort();
      if (record.scope === 'app') {
        return {
          page: 'app',
          block_id: null,
          event: event.name,
          invalid_blocks: invalidBlocks,
          interaction: false,
        };
      }
      return {
        page: record.page_id,
        block_id: event.block_id,
        event: event.name,
        invalid_blocks: invalidBlocks,
        interaction: record.kind !== 'engine',
      };
    })
  );
}

export default listFailurePaths;
