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

import validateTraceEvent from './validateTraceEvent.js';
import validateTraceTarget from './validateTraceTarget.js';

const TRACE_VERSION = 1;
const SOURCES = ['production', 'dev', 'explorer', 'journey'];
const SCOPES = ['page', 'app'];
const KINDS = ['pageview', 'click', 'change', 'key', 'back', 'pageleave', 'engine'];
const TARGET_KINDS = ['click', 'change'];
const TARGETLESS_KINDS = ['pageview', 'back', 'pageleave', 'engine'];
const RUN_SOURCES = ['journey', 'explorer'];
const FRUSTRATIONS = ['rage', 'dead'];

function describe(value) {
  return JSON.stringify(value);
}

function isNonEmptyString(value) {
  return type.isString(value) && value !== '';
}

// `?id=&tab=` names which query keys a page was opened with; `?id=t-1` is a
// customer's record id. Production keeps the first and never the second.
function hasQueryValues({ url }) {
  const query = url.split('#')[0].split('?')[1];
  if (type.isUndefined(query)) return false;
  return query
    .split('&')
    .filter((pair) => pair !== '')
    .some((pair) => {
      const separator = pair.indexOf('=');
      return separator !== -1 && pair.slice(separator + 1) !== '';
    });
}

function validateHeader({ record }) {
  if (record.v !== TRACE_VERSION) {
    return `Trace record "v" should be ${TRACE_VERSION}. Received ${describe(record.v)}.`;
  }
  if (!SOURCES.includes(record.source)) {
    return `Trace record "source" should be one of ${SOURCES.join(', ')}. Received ${describe(
      record.source
    )}.`;
  }
  if (!KINDS.includes(record.kind)) {
    return `Trace record "kind" should be one of ${KINDS.join(', ')}. Received ${describe(
      record.kind
    )}.`;
  }
  if (!SCOPES.includes(record.scope)) {
    return `Trace record "scope" should be one of ${SCOPES.join(', ')}. Received ${describe(
      record.scope
    )}.`;
  }
  if (!isNonEmptyString(record.session)) {
    return `Trace record "session" should be a non-empty string. Received ${describe(
      record.session
    )}.`;
  }
  if (!isNonEmptyString(record.page_id)) {
    return `Trace record "page_id" should be a non-empty string. Received ${describe(
      record.page_id
    )}.`;
  }
  if (!type.isString(record.t) || Number.isNaN(Date.parse(record.t))) {
    return `Trace record "t" should be an ISO date string. Received ${describe(record.t)}.`;
  }
  return undefined;
}

function validateContext({ record }) {
  const nullableStrings = ['person', 'org', 'build'];
  const badKey = nullableStrings.find(
    (key) => !type.isNone(record[key]) && !type.isString(record[key])
  );
  if (!type.isUndefined(badKey)) {
    return `Trace record "${badKey}" should be a string or null. Received ${describe(
      record[badKey]
    )}.`;
  }
  if (
    !type.isNone(record.roles) &&
    (!type.isArray(record.roles) || !record.roles.every(type.isString))
  ) {
    return `Trace record "roles" should be an array of role strings or null. Received ${describe(
      record.roles
    )}.`;
  }
  if (!type.isNone(record.frustration) && !FRUSTRATIONS.includes(record.frustration)) {
    return `Trace record "frustration" should be one of ${FRUSTRATIONS.join(
      ', '
    )} or null. Received ${describe(record.frustration)}.`;
  }
  if (!type.isNone(record.run)) {
    if (!RUN_SOURCES.includes(record.source)) {
      return `Trace record "run" appears only on journey and explorer records. Received ${describe(
        record.run
      )} on a ${record.source} record.`;
    }
    if (!type.isObject(record.run) || !isNonEmptyString(record.run.id)) {
      return `Trace record "run" should be { id, by, journey, actor } with an "id" string. Received ${describe(
        record.run
      )}.`;
    }
  }
  return undefined;
}

function validateUrl({ record, production }) {
  if (record.kind === 'pageview' && !isNonEmptyString(record.url)) {
    return `Trace record of kind "pageview" requires a "url". Received ${describe(record.url)}.`;
  }
  if (type.isNone(record.url)) return undefined;
  if (!type.isString(record.url)) {
    return `Trace record "url" should be a path string. Received ${describe(record.url)}.`;
  }
  if (production && hasQueryValues({ url: record.url })) {
    return `Trace record "url" on a production record should carry query keys only, as "?id=&tab=". Received ${describe(
      record.url
    )}.`;
  }
  return undefined;
}

function validateTargetPlacement({ record }) {
  if (TARGET_KINDS.includes(record.kind)) {
    return validateTraceTarget({ target: record.target });
  }
  if (TARGETLESS_KINDS.includes(record.kind)) {
    if (!type.isNone(record.target)) {
      return `Trace record of kind "${
        record.kind
      }" should have a null "target". Received ${describe(record.target)}.`;
    }
    return undefined;
  }
  // `key`: the target is the focused block when the source knows it.
  if (type.isNone(record.target)) return undefined;
  return validateTraceTarget({ target: record.target });
}

function validateValue({ record, production }) {
  if ('value' in record) {
    if (record.kind !== 'change') {
      return `Trace record "value" appears only on "change" records. Received ${describe(
        record.value
      )} on a ${record.kind} record.`;
    }
    if (production) {
      return `Trace record "value" should never appear on a production record. Received ${describe(
        record.value
      )}.`;
    }
  }
  if (!type.isUndefined(record.redacted)) {
    if (production) {
      return `Trace record "redacted" should never appear on a production record. Received ${describe(
        record.redacted
      )}.`;
    }
    if (record.kind !== 'change' || record.redacted !== true || record.value !== null) {
      return `Trace record "redacted: true" appears only on a "change" record with "value: null". Received ${describe(
        { kind: record.kind, redacted: record.redacted, value: record.value }
      )}.`;
    }
  }
  if (record.kind === 'key' && !isNonEmptyString(record.key)) {
    return `Trace record of kind "key" requires a "key" chord string, as "Enter" or "Mod+k". Received ${describe(
      record.key
    )}.`;
  }
  if (record.kind !== 'key' && !type.isUndefined(record.key)) {
    return `Trace record "key" appears only on "key" records. Received ${describe(
      record.key
    )} on a ${record.kind} record.`;
  }
  return undefined;
}

// Three states of `event`: an object (an event ran and was observed), null
// (the source watched the engine and none ran), or absent (production, which
// cannot see successful events). Only production may leave it out, so
// "unknown" never passes for "none".
function validateEvents({ record, production }) {
  if (!('event' in record) && !production) {
    return `Trace record from a ${record.source} source requires an "event" key: an object, or null when no event ran.`;
  }
  if (record.kind === 'engine' && !type.isObject(record.event)) {
    return `Trace record of kind "engine" requires an "event" object. Received ${describe(
      record.event
    )}.`;
  }
  if (record.scope === 'app' && record.kind !== 'engine') {
    return `Trace record with scope "app" should be of kind "engine". Received kind ${describe(
      record.kind
    )}.`;
  }
  if (!type.isNone(record.event)) {
    const error = validateTraceEvent({ event: record.event, label: 'event', production });
    if (!type.isUndefined(error)) return error;
  }
  if (type.isNone(record.also)) return undefined;
  if (!type.isArray(record.also)) {
    return `Trace record "also" should be an array of events. Received ${describe(record.also)}.`;
  }
  for (let index = 0; index < record.also.length; index += 1) {
    const error = validateTraceEvent({
      event: record.also[index],
      label: `also[${index}]`,
      production,
    });
    if (!type.isUndefined(error)) return error;
  }
  return undefined;
}

// One record of a v1 trace: a DOM interaction joined to the engine event it
// caused, or an engine event no interaction caused. Every source writes this
// shape, so the compiler reads them all the same way. Returns { error } naming
// the first broken rule, or {} when the record is valid.
function validateTraceRecord({ record }) {
  if (!type.isObject(record)) {
    return { error: `Trace record should be an object. Received ${describe(record)}.` };
  }
  const production = record.source === 'production';
  const error =
    validateHeader({ record }) ??
    validateContext({ record }) ??
    validateUrl({ record, production }) ??
    validateTargetPlacement({ record }) ??
    validateValue({ record, production }) ??
    validateEvents({ record, production });
  if (type.isUndefined(error)) return {};
  return { error };
}

export { TRACE_VERSION };

export default validateTraceRecord;
