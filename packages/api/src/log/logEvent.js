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

import isRidSampled from './isRidSampled.js';
import reportingSessions from './reportingSessions.js';
import resolveEventPolicy from './resolveEventPolicy.js';

// The one emitter for wide events: `request_completed`, `step_completed`,
// `endpoint_completed`, `agent_tool_completed` and their `*_failed` twins.
//
// A line carries `config_key`, never a resolved `source`. `source` is a pure
// function of (config_key, git_sha) - both are on every line, git_sha through
// the logger's base - so it resolves at query time from build/keyMap.json
// instead of costing a keyMap read, and the shared file cache it would evict,
// on every step of every request.
//
// Failures are always `info`. Successes are `debug` unless the app asked for
// them: `logger.events: all`, a `sample_rate` this request id falls under, or
// a `session_id` that reported feedback - the trace a developer opens from a
// report has to be whole, so sampling is overridden for that session.
function logEvent({ context, event, fields = {} }) {
  const policy = resolveEventPolicy(context.logger.eventsConfig);
  const failed = event.endsWith('_failed');
  // A journey_event or feedback_submitted line names its own session; a
  // request, step or endpoint line takes the one the calling tab sent on the
  // request (context.sessionId), so a report ties to the requests too.
  const sessionId = fields.session_id ?? context.sessionId ?? null;
  const level =
    failed ||
    policy.level === 'all' ||
    reportingSessions.has(sessionId) ||
    isRidSampled({ rid: context.rid, sampleRate: policy.sampleRate })
      ? 'info'
      : 'debug';

  // Identity is opt-in (logger.events.identity): a user id and a tenant value
  // on every step of every request is a material expansion of what the app's
  // logs hold about a person, so the emitter drops them unless asked.
  const { error, org, ...rest } = fields;
  const line = {
    event,
    rid: context.rid,
    page_id: context.pageId,
    block_id: context.blockId,
    ...rest,
  };
  if (type.isNone(line.session_id) && !type.isNone(sessionId)) {
    line.session_id = sessionId;
  }
  if (policy.identity) {
    line.user = { id: context.user?.id ?? context.user?.sub ?? null };
    if (!type.isNone(org)) {
      line.org = org;
    }
  }
  if (!type.isNone(error)) {
    line.error = {
      name: error.name,
      message: error.message,
      hint: error.hint,
    };
    // pino's `err` serializer keeps the stack and the cause chain on the line.
    line.err = error;
    context.logger[level](line, error.message);
    return;
  }
  context.logger[level](line);
}

export default logEvent;
