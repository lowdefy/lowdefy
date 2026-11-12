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

import runHeadlessExpect from './runHeadlessExpect.js';

const STEP_RUNNER_KEYS = ['click', 'fill', 'select', 'press', 'wait'];

function readGoto(goto) {
  return type.isString(goto) ? { pageId: goto } : goto;
}

// Runs one journey step headless on the current actor (actors.current()): block steps through
// client-core's step runner, then the page settles, a navigation it started included; goto is a
// full page load, back goes back one page, as switches person (opening the journey's first page
// for one met for the first time); expect checks the engine (runHeadlessExpect). call and request
// steps are not run yet.
async function runHeadlessStep({ actors, step, stepTimeout }) {
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
      await runHeadlessExpect({ actor, step, timeout: stepTimeout });
      return;
    default:
      throw new Error(`A headless run does not run "${key}" steps yet.`);
  }
}

export default runHeadlessStep;
