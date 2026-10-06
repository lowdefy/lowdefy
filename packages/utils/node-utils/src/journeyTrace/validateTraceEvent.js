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

function isStringOrNone(value) {
  return type.isNone(value) || type.isString(value);
}

function validateError({ label, error }) {
  if (type.isNone(error)) return undefined;
  if (!type.isObject(error) || !type.isString(error.name)) {
    return `Trace record "${label}.error" should be an object with a "name" string, or null. Received ${JSON.stringify(
      error
    )}.`;
  }
  const badKey = ['config_key', 'action_type', 'action_id'].find(
    (key) => !isStringOrNone(error[key])
  );
  if (!type.isUndefined(badKey)) {
    return `Trace record "${label}.error.${badKey}" should be a string or null. Received ${JSON.stringify(
      error[badKey]
    )}.`;
  }
  return undefined;
}

// `requests` and `endpoints` are the calls the event's actions made, each { id, ok, ms }.
function validateCalls({ label, key, calls }) {
  if (type.isUndefined(calls)) return undefined;
  if (!type.isArray(calls)) {
    return `Trace record "${label}.${key}" should be an array. Received ${JSON.stringify(calls)}.`;
  }
  const bad = calls.find((call) => !type.isObject(call) || !type.isString(call.id));
  if (!type.isUndefined(bad)) {
    return `Trace record "${label}.${key}" entries should be objects with an "id" string. Received ${JSON.stringify(
      bad
    )}.`;
  }
  return undefined;
}

function validateActions({ label, actions }) {
  if (type.isUndefined(actions)) return undefined;
  if (!type.isArray(actions) || !actions.every(type.isString)) {
    return `Trace record "${label}.actions" should be an array of action types. Received ${JSON.stringify(
      actions
    )}.`;
  }
  return undefined;
}

// A state write is { path, type, value }. Production carries no values at all
// ("values are the privacy line"), and a redacted entry exists only so a dev
// source can say a password was written without writing it.
function validateStateWrite({ label, production, write }) {
  if (!type.isObject(write) || !type.isString(write.path) || !type.isString(write.type)) {
    return `Trace record "${label}.state_writes" entries should be objects with "path" and "type" strings. Received ${JSON.stringify(
      write
    )}.`;
  }
  if (production && 'value' in write) {
    return `Trace record "${label}.state_writes" entry on a production record should carry no "value". Received ${JSON.stringify(
      write
    )}.`;
  }
  if (!type.isUndefined(write.redacted)) {
    if (production) {
      return `Trace record "${label}.state_writes" entry on a production record should carry no "redacted". Received ${JSON.stringify(
        write
      )}.`;
    }
    if (write.redacted !== true || write.value !== null) {
      return `Trace record "${label}.state_writes" entry may carry "redacted: true" only with "value: null". Received ${JSON.stringify(
        write
      )}.`;
    }
  }
  return undefined;
}

function validateStateWrites({ label, production, stateWrites }) {
  if (type.isUndefined(stateWrites)) return undefined;
  if (!type.isArray(stateWrites)) {
    return `Trace record "${label}.state_writes" should be an array. Received ${JSON.stringify(
      stateWrites
    )}.`;
  }
  for (const write of stateWrites) {
    const error = validateStateWrite({ label, production, write });
    if (!type.isUndefined(error)) return error;
  }
  return undefined;
}

// The engine event an interaction caused, or an `also` entry beside it. `label`
// names where the object sits ("event", "also[1]") so the error points at it.
function validateTraceEvent({ event, label, production }) {
  if (!type.isObject(event)) {
    return `Trace record "${label}" should be an object. Received ${JSON.stringify(event)}.`;
  }
  if (!type.isString(event.name) || event.name === '') {
    return `Trace record "${label}.name" should be a non-empty string. Received ${JSON.stringify(
      event.name
    )}.`;
  }
  if (!type.isString(event.block_id) || event.block_id === '') {
    return `Trace record "${label}.block_id" should be a non-empty string. Received ${JSON.stringify(
      event.block_id
    )}.`;
  }
  if (![true, false, null].includes(event.success)) {
    return `Trace record "${label}.success" should be true, false or null. Received ${JSON.stringify(
      event.success
    )}.`;
  }
  if (
    !type.isUndefined(event.invalid_blocks) &&
    (!type.isArray(event.invalid_blocks) || !event.invalid_blocks.every(type.isString))
  ) {
    return `Trace record "${label}.invalid_blocks" should be an array of block ids. Received ${JSON.stringify(
      event.invalid_blocks
    )}.`;
  }
  if (!isStringOrNone(event.url_after)) {
    return `Trace record "${label}.url_after" should be a string or null. Received ${JSON.stringify(
      event.url_after
    )}.`;
  }
  return (
    validateError({ label, error: event.error }) ??
    validateActions({ label, actions: event.actions }) ??
    validateCalls({ label, key: 'requests', calls: event.requests }) ??
    validateCalls({ label, key: 'endpoints', calls: event.endpoints }) ??
    validateStateWrites({ label, production, stateWrites: event.state_writes })
  );
}

export default validateTraceEvent;
