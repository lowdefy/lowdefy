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

import collectEventActions from './collectEventActions.js';
import collectEventEndpoints from './collectEventEndpoints.js';
import collectEventRequests from './collectEventRequests.js';
import diffStateWrites from './diffStateWrites.js';

// One completed engine event as a trace record's `event` (or `also` entry),
// built from the engine's trace payload the moment it arrives: the state the
// event wrote is the difference between the copy taken before its actions ran
// and the state now, which later events would change.
function buildTraceEvent({ payload, urlAfter }) {
  const { context, failure, record } = payload;
  const responses = record?.responses ?? {};
  const event = {
    name: payload.eventName,
    block_id: payload.blockId,
    success: payload.success,
    actions: collectEventActions({ responses }),
    requests: collectEventRequests({ context, responses }),
    endpoints: collectEventEndpoints({ context, responses }),
    state_writes: diffStateWrites({
      before: payload.stateBefore,
      after: context?.state,
      values: true,
    }),
    url_after: urlAfter ?? null,
  };
  if (!type.isNone(failure)) {
    event.error = {
      name: failure.errorName ?? 'Error',
      config_key: failure.configKey ?? null,
      action_type: failure.actionType ?? null,
      action_id: failure.actionId ?? null,
    };
    event.invalid_blocks = failure.invalidBlocks ?? [];
  }
  return event;
}

export default buildTraceEvent;
