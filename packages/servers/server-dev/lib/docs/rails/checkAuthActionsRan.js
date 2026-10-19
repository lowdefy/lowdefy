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

import JourneyStepError from '../JourneyStepError.js';
import authEngineMethods from './authEngineMethods.js';
import installAuthActionRecorder from './installAuthActionRecorder.js';
import readAuthActionRecorder from './readAuthActionRecorder.js';

const RECORDER_KEY = '__lowdefyAuthActions';

// On a data-set run (journey.dataSetRails), starts recording the auth-engine
// actions the page executes, before a click acts. Journeys without a data set
// record nothing.
async function armAuthActionRecorder({ journey, page }) {
  if (type.isUndefined(journey.dataSetRails)) {
    return;
  }
  await page.evaluate(installAuthActionRecorder, {
    key: RECORDER_KEY,
    methods: Object.keys(authEngineMethods),
  });
}

// After a click on a data-set run has settled, fails the step when an
// auth-engine action executed: its callers are injected and have no auth
// session, so it fails for a harness reason. An action the chain skipped (a
// validation that stopped it, a skip: condition) never runs, so a click that
// only might reach one is fine. blockId is the clicked block, when known.
async function checkAuthActionsRan({ journey, page, blockId }) {
  if (type.isUndefined(journey.dataSetRails)) {
    return;
  }
  const called = await page.evaluate(readAuthActionRecorder, { key: RECORDER_KEY }).catch(() => []);
  const actions = [...new Set(called.map((method) => authEngineMethods[method] ?? method))];
  if (actions.length === 0) {
    return;
  }
  const subject = type.isNone(blockId) ? 'A click' : `Block "${blockId}"`;
  throw new JourneyStepError(
    `${subject} ran the auth action ${actions.join(
      ', '
    )}, which a data-set journey cannot run: its users are injected and have no auth session. A click that skips the action (a failed validation, a skip condition) is fine.`,
    {
      expected: 'a click that runs no auth action',
      actual: `a click that ran the auth action ${actions.join(', ')}`,
    }
  );
}

export { armAuthActionRecorder };
export default checkAuthActionsRan;
