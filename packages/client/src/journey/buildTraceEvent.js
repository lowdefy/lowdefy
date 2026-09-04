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

import collectEventRequests from './collectEventRequests.js';
import diffStateWrites from './diffStateWrites.js';
import flattenActions from './flattenActions.js';
import toJsonSafe from './toJsonSafe.js';

function actionOutcome({ action, response }) {
  if (type.isNone(response)) {
    // An 'async: true' action resolves after the event record is built, so its
    // outcome is genuinely not known yet - never guess it as a success.
    return action.async === true ? 'pending' : 'skipped';
  }
  if (!type.isNone(response.error)) return 'error';
  if (response.skipped === true) return 'skipped';
  return 'ok';
}

// One completed event, as the corpus records it. `values` is the dev-only
// branch: the event payload and the written values are attached here and
// nowhere else, so a production recorder that never sets it cannot leak one.
function buildTraceEvent({
  blockType,
  actions,
  context,
  pageInstance,
  record,
  sessionId,
  stateBefore,
  values,
  window,
}) {
  const responses = record.responses ?? {};
  const traceEvent = {
    t: (record.endTimestamp ?? new Date()).toISOString(),
    session_id: sessionId,
    page_instance: pageInstance,
    page_id: context.pageId,
    block_id: record.blockId,
    // The block's type lets the compiler map onChange to a `set` step without a build.
    block_type: blockType ?? null,
    event_name: record.eventName,
    success: record.success !== false,
    error: type.isNone(record.error)
      ? null
      : { name: record.error.name ?? 'Error', config_key: record.error.configKey ?? null },
    actions: flattenActions(actions).map((action) => ({
      id: action.id,
      type: action.type,
      config_key: action['~k'] ?? null,
      outcome: actionOutcome({ action, response: responses[action.id] }),
    })),
    requests: collectEventRequests({ context, responses }),
    state_writes: diffStateWrites({ after: context.state, before: stateBefore, values }),
    url_after: window.location?.href ?? null,
  };
  if (values) {
    traceEvent.payload = toJsonSafe(record.event);
  }
  return traceEvent;
}

export default buildTraceEvent;
