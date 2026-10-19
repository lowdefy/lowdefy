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

import describeLogValue from './describeLogValue.js';

// Request and CallAPI show as the request or endpoint they called, with
// whether it succeeded, so they are not repeated in the list of actions.
const CALL_ACTION_TYPES = ['Request', 'CallAPI'];
const MAX_STATE_WRITES = 5;

function describeCall({ kind, call }) {
  if (call.ok === true) return `${kind} ${call.id} ok`;
  if (call.ok === false) return `${kind} ${call.id} failed`;
  return `${kind} ${call.id}`;
}

// The action types that ran, in order, without the calls (shown on their own)
// and without the one that failed (shown as the failure).
function actionsRun({ event }) {
  const actions = (event.actions ?? []).filter((action) => !CALL_ACTION_TYPES.includes(action));
  const failedType = event.error?.action_type;
  if (event.success !== false || type.isNone(failedType)) return actions;
  const index = actions.lastIndexOf(failedType);
  if (index === -1) return actions;
  return [...actions.slice(0, index), ...actions.slice(index + 1)];
}

function describeStateWrite(write) {
  if (write.redacted === true) return `${write.path} (redacted)`;
  if (write.type === 'undefined') return `${write.path} removed`;
  if (!('value' in write)) return write.path;
  return `${write.path} = ${describeLogValue(write.value)}`;
}

function describeStateWrites({ event }) {
  const writes = event.state_writes ?? [];
  if (writes.length === 0) return undefined;
  const shown = writes.slice(0, MAX_STATE_WRITES).map(describeStateWrite);
  const more = writes.length > MAX_STATE_WRITES ? ` (+${writes.length - MAX_STATE_WRITES})` : '';
  return `state ${shown.join(', ')}${more}`;
}

function describeFailure({ event }) {
  const { error } = event;
  const invalid =
    type.isArray(event.invalid_blocks) && event.invalid_blocks.length > 0
      ? ` [${event.invalid_blocks.join(', ')}]`
      : '';
  if (type.isString(error?.action_type)) {
    return `${error.action_type} failed${invalid}`;
  }
  const name = type.isString(error?.name) ? ` (${error.name})` : '';
  return `${event.name} failed${name}${invalid}`;
}

function describeEvent({ event }) {
  const parts = [];
  const actions = actionsRun({ event });
  if (actions.length > 0) parts.push(`ran ${actions.join(', ')}`);
  (event.requests ?? []).forEach((call) => parts.push(describeCall({ kind: 'request', call })));
  (event.endpoints ?? []).forEach((call) => parts.push(describeCall({ kind: 'endpoint', call })));
  const state = describeStateWrites({ event });
  if (!type.isUndefined(state)) parts.push(state);
  if (event.success === false) parts.push(describeFailure({ event }));
  return parts;
}

// What the app did in response to one record: the actions its events ran, the
// requests and endpoints they called and whether each succeeded, the state
// they wrote and the failure, if any. `also` events (outer handlers the same
// interaction reached) follow the innermost one. Empty when the record holds
// no event, as a production record of a successful interaction does.
function describeLogOutcome({ record }) {
  const events = [record.event, ...(record.also ?? [])].filter(type.isObject);
  return events.flatMap((event) => describeEvent({ event })).join(', ');
}

export default describeLogOutcome;
