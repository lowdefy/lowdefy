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

import { getStepKey } from '@lowdefy/node-utils';
import { get, type } from '@lowdefy/helpers';

import collectBlockParents from './collectBlockParents.js';
import HeadlessStepError from './HeadlessStepError.js';
import isBlockShown from './isBlockShown.js';
import isDeepEqual from './isDeepEqual.js';
import pollUntil from './pollUntil.js';
import toJsonValue from './toJsonValue.js';

function readBlockId(target) {
  return type.isString(target) ? target : target.blockId;
}

function plural(count) {
  return `${count} time${count === 1 ? '' : 's'}`;
}

// Whether the block a check names is shown on the actor's page: null when it is not on the page.
function readShown({ actor, blockId }) {
  const { context } = actor.page;
  const block = context._internal.RootSlots.map[blockId];
  if (type.isNone(block)) {
    return null;
  }
  const { parents } = collectBlockParents({ context });
  return isBlockShown({ block, openBlocks: actor.page.openBlocks, parents });
}

async function expectState({ actor, params, timeout }) {
  const { equals, path } = params;
  const { held, value } = await pollUntil({
    check: (read) => isDeepEqual(read, equals),
    read: () => toJsonValue(get(actor.page.context.state, path)),
    timeout,
  });
  if (!held) {
    throw new HeadlessStepError(
      `Expected state "${path}" to equal ${JSON.stringify(equals)} but found ${JSON.stringify(
        value
      )}.`,
      { actual: value, expected: equals }
    );
  }
}

async function expectShown({ actor, params, shown, timeout }) {
  const blockId = readBlockId(params);
  const { held } = await pollUntil({
    // A block that is not on the page is hidden, as a browser finds no element for it.
    check: (read) => (shown ? read === true : read !== true),
    read: () => readShown({ actor, blockId }),
    timeout,
  });
  if (!held) {
    const description = `block "${blockId}" to be ${shown ? 'visible' : 'hidden'}`;
    throw new HeadlessStepError(`Expected ${description}.`, {
      actual: shown ? 'not visible' : 'visible',
      expected: description,
    });
  }
}

// Counted once the page has settled, without polling, as the browser runner counts: "not called"
// can only be judged once the moment has passed. A request is counted on the current page unless
// the check names its pageId.
async function expectCalls({ actor, params }) {
  if (!type.isUndefined(params.payload) || !type.isUndefined(params.response)) {
    throw new Error("A headless run does not check a call's payload or response yet.");
  }
  await actor.settle();
  let description;
  let calls;
  if (type.isUndefined(params.endpoint)) {
    const pageId = params.pageId ?? actor.page.pageId;
    description = `request "${params.request}" on page "${pageId}"`;
    calls = actor.calls.filter(
      (call) =>
        call.kind === 'request' && call.requestId === params.request && call.pageId === pageId
    );
  } else {
    description = `endpoint "${params.endpoint}"`;
    calls = actor.calls.filter(
      (call) => call.kind === 'endpoint' && call.endpointId === params.endpoint
    );
  }
  if (calls.length !== params.count) {
    throw new HeadlessStepError(
      `Expected ${description} to have been called ${plural(
        params.count
      )} but it was called ${plural(calls.length)}.`,
      { actual: calls.length, expected: params.count }
    );
  }
}

async function expectUrl({ actor, params, timeout }) {
  const { contains } = params;
  const { held, value } = await pollUntil({
    check: (url) => type.isString(url) && url.includes(contains),
    read: () => actor.url(),
    timeout,
  });
  if (!held) {
    throw new HeadlessStepError(
      `Expected url to contain "${contains}" but found ${JSON.stringify(value)}.`,
      { actual: value, expected: `url to contain "${contains}"` }
    );
  }
}

// One expect step on the current actor's page, with the browser runner's messages. expect.error
// is judged with the app errors (createAppErrorWindows), so the step itself does nothing.
async function runHeadlessExpect({ actor, step, timeout }) {
  const kind = getStepKey(step.expect);
  const params = step.expect[kind];
  switch (kind) {
    case 'state':
      return expectState({ actor, params, timeout });
    case 'visible':
      return expectShown({ actor, params, shown: true, timeout });
    case 'hidden':
      return expectShown({ actor, params, shown: false, timeout });
    case 'calls':
      return expectCalls({ actor, params });
    case 'url':
      return expectUrl({ actor, params, timeout });
    case 'error':
      return undefined;
    default:
      throw new Error(`A headless run does not check "expect.${kind}" yet.`);
  }
}

export default runHeadlessExpect;
