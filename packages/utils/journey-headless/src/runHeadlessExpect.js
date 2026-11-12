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
import expectAnswerError from './expectAnswerError.js';
import expectAnswerStatus from './expectAnswerStatus.js';
import expectCalls from './expectCalls.js';
import expectDb from './expectDb.js';
import HeadlessStepError from './HeadlessStepError.js';
import isBlockShown from './isBlockShown.js';
import isDeepEqual from './isDeepEqual.js';
import pollUntil from './pollUntil.js';
import toJsonValue from './toJsonValue.js';

function readBlockId(target) {
  return type.isString(target) ? target : target.blockId;
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

// One expect step, with the browser runner's messages: on the current actor's page, on the answer
// of the call or request step before it (`answer`, for status and error), or on the data's
// database. After an interaction, expect.error is judged with the app errors
// (createAppErrorWindows), so the step itself does nothing.
async function runHeadlessExpect({ actor, answer, host, step, timeout }) {
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
      if (!type.isUndefined(answer)) {
        expectAnswerError({ answer, text: params });
      }
      return undefined;
    case 'status':
      return expectAnswerStatus({ answer, status: params });
    case 'db':
      return expectDb({ host, params, timeout });
    default:
      // The grammar admits nothing else; a check it gains is not passed unchecked.
      throw new Error(`The headless journey runner has no expect "${kind}".`);
  }
}

export default runHeadlessExpect;
