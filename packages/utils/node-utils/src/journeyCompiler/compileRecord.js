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

import { isMountEventName, type } from '@lowdefy/helpers';

import compileStateExpectations from './compileStateExpectations.js';
import compileTarget from './compileTarget.js';
import urlContains from './urlContains.js';

// No v7 journey verb drives a date picker or an object-valued input: `fill`
// types into an input or textarea, and `select` picks an option by its text.
const MANUAL_VALUE_TYPES = ['date', 'object'];

function emptyResult() {
  return { steps: [], comments: [], failure: undefined, flags: [], ends: false };
}

function describeEvent({ event }) {
  return `${event.name} on "${event.block_id}"`;
}

function failureName({ record, event }) {
  if (record.scope === 'app') return `app.${event.name}`;
  return `${record.page_id}.${event.block_id}.${event.name}`;
}

function describeError({ error }) {
  if (type.isNone(error)) return 'an error';
  const where = type.isString(error.action_type) ? ` in ${error.action_type}` : '';
  const key = type.isString(error.config_key) ? ` (${error.config_key})` : '';
  return `${error.name}${where}${key}`;
}

// A failure in `also` (an outer handler the same interaction reached) is a
// failure of the interaction.
function failedEvent({ record }) {
  const events = [record.event, ...(record.also ?? [])];
  return events.find((event) => type.isObject(event) && event.success === false);
}

function compilePageview({ record }) {
  const result = emptyResult();
  if (record.caused !== true) return result;
  const contains = urlContains({ url: record.url, pathOnly: record.source === 'production' });
  if (!type.isUndefined(contains)) result.steps.push({ expect: { url: { contains } } });
  return result;
}

function compileEngine({ record }) {
  const result = emptyResult();
  const { event } = record;
  if (event.success === false) {
    result.comments.push(
      `${describeEvent({ event })} failed with no interaction causing it: ${describeError({
        error: event.error,
      })}.`
    );
    result.failure = failureName({ record, event });
    return result;
  }
  if (record.scope === 'app' || isMountEventName({ eventName: event.name })) return result;
  result.comments.push(
    `${describeEvent({ event })} ran with no interaction causing it; not a step.`
  );
  return result;
}

function isTypedCharacter(key) {
  return key.length === 1;
}

function compileFill({ record }) {
  const { target } = record;
  const fill = { blockId: target.block_id };
  if (!type.isNone(target.row)) fill.row = target.row;
  if (!type.isNone(target.column)) fill.column = target.column;
  const comments = [];
  if (record.redacted === true) {
    comments.push("password not recorded: fill from the journey's user");
    return { step: { fill: { ...fill, value: null, from: 'shape' } }, comments };
  }
  if ('value' in record && record.source !== 'production') {
    return { step: { fill: { ...fill, value: record.value, from: 'recorded' } }, comments };
  }
  const write = (record.event?.state_writes ?? []).find(
    (entry) => entry.path === target.block_id && 'value' in entry && entry.redacted !== true
  );
  if (!type.isUndefined(write) && record.source !== 'production') {
    return { step: { fill: { ...fill, value: write.value, from: 'recorded' } }, comments };
  }
  return { step: { fill: { ...fill, value: null, from: 'shape' } }, comments };
}

function tokenComment({ target }) {
  return `clicked text not in config: ${target.text_token}`;
}

// A production click whose text token resolved to no config string: the
// element showed text, but not text the app's config holds (a data row, a
// label built from values), so the step carries no text.
function isTokenised({ target }) {
  return (
    (!type.isString(target.text) || target.text === '') &&
    type.isString(target.text_token) &&
    target.text_token !== ''
  );
}

function compileSelect({ record }) {
  const { target } = record;
  const select = { blockId: target.block_id };
  if (!type.isNone(target.row)) select.row = target.row;
  if (!type.isNone(target.column)) select.column = target.column;
  if (type.isString(target.text) && target.text !== '') {
    return { step: { select: { ...select, value: target.text } }, comments: [] };
  }
  if (isTokenised({ target })) {
    return {
      step: { select: { ...select, value: null, from: 'shape' } },
      comments: [tokenComment({ target })],
      flag: 'tokenised-text',
    };
  }
  return { step: { select: { ...select, value: null, from: 'shape' } }, comments: [] };
}

// The step the interaction itself compiles to, before any assertion about its
// outcome. Returns { step, comments, flag }; step is undefined when the
// interaction is not something a journey verb can do.
function compileInteractionStep({ record, blockMetas }) {
  const { target } = record;
  if (record.kind === 'key') {
    // A printable character typed into a field is part of its change record.
    if (isTypedCharacter(record.key)) return { comments: [] };
    return { step: { press: record.key }, comments: [] };
  }
  const blockId = target.block_id;
  const valueType = blockMetas[target.block_type]?.valueType;
  if (MANUAL_VALUE_TYPES.includes(valueType)) {
    return {
      comments: [
        `${blockId} (${target.block_type}): no v7 journey verb drives this input; write the step by hand`,
      ],
      flag: 'manual-input',
    };
  }
  const hasBlock = type.isString(blockId) && blockId !== '';
  const hasText = type.isString(target.text) && target.text !== '';
  if (!hasBlock && (record.kind === 'change' || target.option === true || !hasText)) {
    const known = isTokenised({ target }) ? ` (${tokenComment({ target })})` : '';
    return {
      comments: [
        `${record.kind} on a control known neither by block nor by kept text${known}: write the step by hand`,
      ],
      flag: 'unresolved-target',
    };
  }
  if (record.kind === 'change') return compileFill({ record });
  if (target.option === true) return compileSelect({ record });
  const comments =
    record.frustration === 'dead' ? ['dead click in production: assert what this should do'] : [];
  if (isTokenised({ target })) {
    return {
      step: { click: compileTarget({ target }) },
      comments: [...comments, tokenComment({ target })],
      flag: 'tokenised-text',
    };
  }
  return { step: { click: compileTarget({ target }) }, comments };
}

// What the interaction's event adds: a failure ends the segment at this step;
// an observed success adds a wait for its last request and, outside
// production, its state writes as expectations. `asserts` is false when the
// interaction compiled to no step, so there is nothing to assert after.
function compileOutcome({ record, result, asserts }) {
  const failed = failedEvent({ record });
  if (!type.isUndefined(failed)) {
    let comment = `failed here: ${describeError({ error: failed.error })}`;
    if (failed.error?.action_type === 'Validate' && type.isArray(failed.invalid_blocks)) {
      comment = `${comment}, invalid: [${failed.invalid_blocks.join(', ')}]`;
    }
    result.comments.push(comment);
    result.failure = failureName({ record, event: failed });
    result.ends = true;
    return;
  }
  const { event } = record;
  if (!asserts || !type.isObject(event) || event.success !== true) return;
  const requests = event.requests ?? [];
  if (requests.length > 0) {
    result.steps.push({ wait: { request: requests[requests.length - 1].id } });
  }
  if (record.source !== 'production') {
    result.steps.push(...compileStateExpectations({ event }));
  }
}

function compileInteraction({ record, blockMetas }) {
  const result = emptyResult();
  const { step, comments, flag } = compileInteractionStep({ record, blockMetas });
  result.comments.push(...comments);
  if (!type.isUndefined(flag)) result.flags.push(flag);
  if (!type.isUndefined(step)) result.steps.push(step);
  compileOutcome({ record, result, asserts: !type.isUndefined(step) });
  return result;
}

// One folded v1 record's contribution to a journey: its steps, the comments
// that sit above the first of them (or above the next step when it has none),
// the failure it records, flags for the candidate's origin, and whether the
// segment ends there. Every DOM interaction is a step whether or not an
// engine event was observed; the event only adds what to assert.
function compileRecord({ record, blockMetas = {} }) {
  switch (record.kind) {
    case 'pageview':
      return compilePageview({ record });
    case 'back': {
      const result = emptyResult();
      result.steps.push({ back: true });
      return result;
    }
    case 'engine':
      return compileEngine({ record });
    case 'click':
    case 'change':
    case 'key':
      return compileInteraction({ record, blockMetas });
    default:
      return emptyResult();
  }
}

export default compileRecord;
