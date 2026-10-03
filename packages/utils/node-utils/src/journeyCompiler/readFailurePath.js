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

function failedEvent({ record }) {
  const events = [record.event, ...(record.also ?? [])];
  return events.find((event) => type.isObject(event) && event.success === false);
}

// Where a segment first failed, as the production profile and coverage key
// failure paths: page, block, event and the invalid blocks a Validate named
// (sorted). An app event has no page block, so it is keyed `app.<event>`.
// Undefined for a segment with no failed event.
function readFailurePath({ records }) {
  for (const record of records) {
    const event = failedEvent({ record });
    if (type.isUndefined(event)) continue;
    const invalidBlocks = [...(event.invalid_blocks ?? [])].sort();
    if (record.scope === 'app') {
      return { page: 'app', block_id: null, event: event.name, invalid_blocks: invalidBlocks };
    }
    return {
      page: record.page_id,
      block_id: event.block_id,
      event: event.name,
      invalid_blocks: invalidBlocks,
    };
  }
  return undefined;
}

export default readFailurePath;
