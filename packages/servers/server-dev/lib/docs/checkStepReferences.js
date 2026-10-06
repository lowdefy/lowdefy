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
import { getStepKey, normaliseBlockId } from '@lowdefy/node-utils';

import getPageConfig from './getPageConfig.js';
import JourneyStepError from './JourneyStepError.js';
import pageBlocks from './pageBlocks.js';
import readBuildArtifact from './readBuildArtifact.js';
import readPageArtifact from './readPageArtifact.js';

const TARGET_STEPS = ['click', 'open', 'fill', 'select'];
const TARGET_EXPECTATIONS = ['visible', 'hidden', 'text'];

// Lists the known ids in a failure when there are few enough to read.
function describeKnown({ ids, noun }) {
  if (ids.length === 0) {
    return `It has no ${noun}s.`;
  }
  if (ids.length > 20) {
    return '';
  }
  return `Known ${noun}s: ${ids.join(', ')}.`;
}

function unknownReference({ message, expected, actual }) {
  return new JourneyStepError(message, { expected, actual });
}

// The blockId a step's target names, or undefined for a target with none (a
// page-wide `text` or `containing` target) and for steps that name no target.
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
  if (type.isString(target)) {
    return target;
  }
  return target?.blockId;
}

// The id of the Lowdefy page the actor's tab shows, or null when none shows (an
// opened email, a page that left the app) or the tab is navigating.
async function readCurrentPageId({ page }) {
  try {
    return (await page.evaluate(() => window.lowdefy?.pageId)) ?? null;
  } catch {
    return null;
  }
}

function builtBlockIds(built) {
  return [built.blockId, ...pageBlocks(built).map((block) => block.blockId)];
}

function hasBlock({ ids, blockId }) {
  const normalised = normaliseBlockId(blockId);
  return ids.some((id) => normaliseBlockId(id) === normalised);
}

// A block of the page the journey opened is not a misspelling either: the app
// may have sent the person elsewhere (a guarded page redirecting home, a
// refused page showing the not-found page), and the step then fails as not
// visible, which says what happened. The opened page's own id always counts,
// so a page the server refused (and never built) still fails that way.
function isBlockOfJourneyPage({ blockId, journeyPageId }) {
  if (blockId === journeyPageId) {
    return true;
  }
  const built = readPageArtifact({ pageId: journeyPageId });
  return built !== null && hasBlock({ ids: builtBlockIds(built), blockId });
}

function checkBlockId({ blockId, pageId, journeyPageId }) {
  const known = builtBlockIds(readPageArtifact({ pageId }));
  if (hasBlock({ ids: known, blockId })) {
    return;
  }
  if (pageId !== journeyPageId && isBlockOfJourneyPage({ blockId, journeyPageId })) {
    return;
  }
  throw unknownReference({
    message: `Page "${pageId}" has no block "${blockId}". ${describeKnown({
      ids: known,
      noun: 'block',
    })}`.trim(),
    expected: `a block "${blockId}" on page "${pageId}"`,
    actual: `no block "${blockId}"`,
  });
}

// A request is counted on a page the journey may not have visited yet, so that
// page is built first, as a visit would build it.
async function checkRequestId({ requestId, pageId, currentPageId }) {
  if (pageId !== currentPageId) {
    const config = await getPageConfig({ pageId });
    if (config === null) {
      throw unknownReference({
        message: `There is no page "${pageId}" to count request "${requestId}" on.`,
        expected: `a page "${pageId}"`,
        actual: `no page "${pageId}"`,
      });
    }
  }
  const request = readBuildArtifact({ name: `pages/${pageId}/requests/${requestId}.json` });
  if (request !== null) {
    return;
  }
  const built = readPageArtifact({ pageId });
  const known = (built?.requests ?? []).map((item) => item.requestId);
  throw unknownReference({
    message: `Page "${pageId}" has no request "${requestId}". ${describeKnown({
      ids: known,
      noun: 'request',
    })}`.trim(),
    expected: `a request "${requestId}" on page "${pageId}"`,
    actual: `no request "${requestId}"`,
  });
}

function checkEndpointId({ endpointId }) {
  if (readBuildArtifact({ name: `api/${endpointId}.json` }) !== null) {
    return;
  }
  throw unknownReference({
    message: `The app has no endpoint "${endpointId}".`,
    expected: `an endpoint "${endpointId}"`,
    actual: `no endpoint "${endpointId}"`,
  });
}

function checkPageId({ pageId }) {
  const registry = readBuildArtifact({ name: 'pageRegistry.json' });
  if (Object.prototype.hasOwnProperty.call(registry, pageId)) {
    return;
  }
  throw unknownReference({
    message: `The app has no page "${pageId}". ${describeKnown({
      ids: Object.keys(registry),
      noun: 'page',
    })}`.trim(),
    expected: `a page "${pageId}"`,
    actual: `no page "${pageId}"`,
  });
}

// On a data set run, an `as` name opens that data set user, so a name that is
// neither the journey's first actor nor one of its users is a misspelling.
// Without a data set any name is a new browser as the journey's user.
function checkActorName({ journey, name }) {
  if (type.isUndefined(journey.dataSetUsers) || name === journey.mainActor) {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(journey.dataSetUsers, name)) {
    return;
  }
  const users = Object.keys(journey.dataSetUsers);
  throw unknownReference({
    message: `"as" names "${name}", who is neither "${
      journey.mainActor
    }" nor a user of the data set. ${describeKnown({ ids: users, noun: 'user' })}`.trim(),
    expected: `"${journey.mainActor}" or a data set user`,
    actual: `no data set user "${name}"`,
  });
}

// Checked at the start of every step, before it acts, against the current
// build: a misspelt blockId, requestId, endpointId, goto pageId or `as` name
// fails its step and names the unknown id, instead of passing a step that
// asserts something is absent (expect.hidden, expect.calls with count 0) or
// opening the not-found page. Ids are read from the actor's current page (a
// block also from the page the journey opened); when no Lowdefy page shows,
// block and request checks are skipped and the step's own wait reports what it
// finds.
async function checkStepReferences({ journey, page, step }) {
  const key = getStepKey(step);
  if (key === 'as') {
    checkActorName({ journey, name: step.as });
    return;
  }
  if (key === 'goto') {
    checkPageId({ pageId: type.isString(step.goto) ? step.goto : step.goto.pageId });
    return;
  }
  const calls = key === 'expect' && getStepKey(step.expect) === 'calls' ? step.expect.calls : null;
  if (calls !== null && !type.isUndefined(calls.endpoint)) {
    checkEndpointId({ endpointId: calls.endpoint });
    return;
  }
  const blockId = readTargetBlockId(step);
  const requestId = key === 'wait' ? step.wait.request : calls?.request;
  if (type.isUndefined(blockId) && type.isUndefined(requestId)) {
    return;
  }
  const currentPageId = await readCurrentPageId({ page });
  if (!type.isUndefined(blockId) && currentPageId !== null) {
    checkBlockId({ blockId, pageId: currentPageId, journeyPageId: journey.pageId });
  }
  if (!type.isUndefined(requestId)) {
    const pageId = calls?.pageId ?? currentPageId;
    if (pageId !== null) {
      await checkRequestId({ requestId, pageId, currentPageId });
    }
  }
}

export default checkStepReferences;
