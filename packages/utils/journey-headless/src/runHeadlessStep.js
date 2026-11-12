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
import { type } from '@lowdefy/helpers';

import runHeadlessCall from './runHeadlessCall.js';
import runHeadlessExpect from './runHeadlessExpect.js';

const STEP_RUNNER_KEYS = ['click', 'fill', 'select', 'press', 'wait'];

function readGoto(goto) {
  return type.isString(goto) ? { pageId: goto } : goto;
}

// Runs one journey step headless on the current actor (actors.current()): block steps through
// client-core's step runner, then the page settles, a navigation it started included; goto is a
// full page load, back goes back one page, as switches person (opening the journey's first page
// for one met for the first time); call and request go to the server directly, as the step's
// `as` or the current actor, and resolve the answer the expect steps after them read; expect
// checks the engine, the answer or the data (runHeadlessExpect). Resolves the answer of a call or
// request, and undefined for any other step.
async function runHeadlessStep({ actors, answer, host, step, stepTimeout }) {
  const key = getStepKey(step);
  const actor = actors.current();
  if (STEP_RUNNER_KEYS.includes(key)) {
    await actor.stepRunner.run({ step });
    await actor.settle();
    return;
  }
  switch (key) {
    case 'goto':
      await actor.load(readGoto(step.goto));
      await actor.settle();
      return;
    case 'back':
      await actor.back();
      await actor.settle();
      return;
    case 'as':
      await actors.switchTo(step.as);
      await actors.current().settle();
      return;
    case 'expect':
      await runHeadlessExpect({ actor, answer, host, step, timeout: stepTimeout });
      return;
    case 'call':
    case 'request':
      return runHeadlessCall({ actors, host, step });
    default:
      // The grammar admits nothing else; a step it gains is not passed unchecked.
      throw new Error(`The headless journey runner has no step "${key}".`);
  }
}

export default runHeadlessStep;
