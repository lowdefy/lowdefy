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

import { getStepKey, normaliseBlockId } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import HeadlessStepError from './HeadlessStepError.js';
import listPageBlockIds from './listPageBlockIds.js';

const MAIN_ACTOR = 'main';
const TARGET_STEPS = ['click', 'fill', 'select'];
const TARGET_EXPECTATIONS = ['visible', 'hidden'];

function describeKnown({ ids, noun }) {
  if (ids.length === 0) {
    return `It has no ${noun}s.`;
  }
  if (ids.length > 20) {
    return '';
  }
  return `Known ${noun}s: ${ids.join(', ')}.`;
}

function unknownReference({ actual, expected, message }) {
  return new HeadlessStepError(message.trim(), { actual, expected });
}

function readTargetBlockId(step) {
  const key = getStepKey(step);
  let target;
  if (TARGET_STEPS.includes(key)) {
    target = step[key];
  } else if (key === 'expect') {
    const expectation = getStepKey(step.expect);
    if (TARGET_EXPECTATIONS.includes(expectation)) {
      target = step.expect[expectation];
    }
  }
  return type.isString(target) ? target : target?.blockId;
}

function hasBlock({ blockId, ids }) {
  const normalised = normaliseBlockId(blockId);
  return ids.some((id) => normaliseBlockId(id) === normalised);
}

function builtBlockIds({ host, pageId }) {
  const page = host.readArtifact(`pages/${pageId}.json`);
  return page === null ? [] : listPageBlockIds(page);
}

// A block of the page the journey opened is not a misspelling either: the app may have sent the
// person elsewhere, and the step then fails as not visible.
function checkBlockId({ actor, blockId, host, journeyPageId }) {
  const { context, pageId } = actor.page;
  const known = builtBlockIds({ host, pageId });
  const engineIds = Object.keys(context._internal.RootSlots.map);
  if (hasBlock({ blockId, ids: [...known, ...engineIds] })) {
    return;
  }
  if (
    pageId !== journeyPageId &&
    (blockId === journeyPageId ||
      hasBlock({ blockId, ids: builtBlockIds({ host, pageId: journeyPageId }) }))
  ) {
    return;
  }
  throw unknownReference({
    message: `Page "${pageId}" has no block "${blockId}". ${describeKnown({
      ids: known,
      noun: 'block',
    })}`,
    expected: `a block "${blockId}" on page "${pageId}"`,
    actual: `no block "${blockId}"`,
  });
}

function listPageIds({ host }) {
  return (host.readArtifact('routes.json') ?? []).map((route) => route.pageId);
}

function checkPageId({ host, pageId }) {
  const ids = listPageIds({ host });
  if (ids.includes(pageId)) {
    return;
  }
  throw unknownReference({
    message: `The app has no page "${pageId}". ${describeKnown({ ids, noun: 'page' })}`,
    expected: `a page "${pageId}"`,
    actual: `no page "${pageId}"`,
  });
}

function checkRequestId({ host, pageId, requestId }) {
  if (!listPageIds({ host }).includes(pageId)) {
    throw unknownReference({
      message: `There is no page "${pageId}" for request "${requestId}".`,
      expected: `a page "${pageId}"`,
      actual: `no page "${pageId}"`,
    });
  }
  if (host.readArtifact(`pages/${pageId}/requests/${requestId}.json`) !== null) {
    return;
  }
  const page = host.readArtifact(`pages/${pageId}.json`);
  const known = (page?.requests ?? []).map((request) => request.requestId);
  throw unknownReference({
    message: `Page "${pageId}" has no request "${requestId}". ${describeKnown({
      ids: known,
      noun: 'request',
    })}`,
    expected: `a request "${requestId}" on page "${pageId}"`,
    actual: `no request "${requestId}"`,
  });
}

function checkEndpointId({ endpointId, host }) {
  if (host.readArtifact(`api/${endpointId}.json`) !== null) {
    return;
  }
  throw unknownReference({
    message: `The app has no endpoint "${endpointId}".`,
    expected: `an endpoint "${endpointId}"`,
    actual: `no endpoint "${endpointId}"`,
  });
}

// On a data set run an `as` name opens that data set user, so a name that is neither the first
// actor nor one of its users is a misspelling. Without a data set any name is a new person.
function checkActorName({ host, name }) {
  if (host.dataSetName === null || name === MAIN_ACTOR || host.userNames.includes(name)) {
    return;
  }
  throw unknownReference({
    message: `"as" names "${name}", who is neither "${MAIN_ACTOR}" nor a user of the data set. ${describeKnown(
      { ids: host.userNames, noun: 'user' }
    )}`,
    expected: `"${MAIN_ACTOR}" or a data set user`,
    actual: `no data set user "${name}"`,
  });
}

// Checked at the start of every step against the build, as the browser runner checks it
// (server-dev's checkStepReferences): a misspelt blockId, requestId, endpointId, goto pageId or
// `as` name fails its step and names the unknown id, instead of passing a step that asserts
// something is absent (expect.hidden, expect.calls with count 0). Block and request ids are read
// from the actor's current page; with no page open they are not checked.
function checkStepReferences({ actor, host, journeyPageId, step }) {
  const key = getStepKey(step);
  if (key === 'as') {
    checkActorName({ host, name: step.as });
    return;
  }
  if (key === 'goto') {
    checkPageId({ host, pageId: type.isString(step.goto) ? step.goto : step.goto.pageId });
    return;
  }
  if (key === 'call') {
    checkEndpointId({ endpointId: step.call.endpoint, host });
    return;
  }
  if (key === 'request') {
    checkRequestId({ host, pageId: step.request.pageId, requestId: step.request.requestId });
    return;
  }
  const calls = key === 'expect' && getStepKey(step.expect) === 'calls' ? step.expect.calls : null;
  if (calls !== null && !type.isUndefined(calls.endpoint)) {
    checkEndpointId({ endpointId: calls.endpoint, host });
    return;
  }
  const blockId = readTargetBlockId(step);
  const requestId = key === 'wait' ? step.wait.request : calls?.request;
  if (type.isNone(actor.page)) {
    return;
  }
  if (!type.isUndefined(blockId)) {
    checkBlockId({ actor, blockId, host, journeyPageId });
  }
  if (!type.isUndefined(requestId)) {
    checkRequestId({ host, pageId: calls?.pageId ?? actor.page.pageId, requestId });
  }
}

export default checkStepReferences;
