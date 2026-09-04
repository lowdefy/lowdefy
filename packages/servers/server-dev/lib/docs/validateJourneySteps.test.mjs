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

import { JOURNEY_STEP_KEYS, validateJourneySteps as shared } from '@lowdefy/node-utils';

import validateJourneySteps, { getStepKey, STEP_KEYS } from './validateJourneySteps.js';

// The grammar itself is tested in @lowdefy/node-utils. What must hold here is
// that the dev server has no grammar of its own: the CLI and this server accept
// exactly the same steps.
test('validateJourneySteps is the shared grammar validator, not a copy', () => {
  expect(validateJourneySteps).toBe(shared);
  expect(STEP_KEYS).toBe(JOURNEY_STEP_KEYS);
});

test('validateJourneySteps accepts every step of the grammar', () => {
  expect(
    validateJourneySteps({
      steps: [
        { click: 'submit' },
        { fill: { blockId: 'title', value: 'Access reviews' } },
        { set: { blockId: 'rating', value: 4 } },
        { select: { blockId: 'country', value: 'Chile' } },
        { press: 'Mod+k' },
        { press: { blockId: 'title', key: 'Enter' } },
        { wait: { ms: 10 } },
        { wait: { request: 'get_controls' } },
        { wait: { state: 'controls' } },
        { screenshot: 'after' },
        { expect: { state: { path: 'saved', equals: true } } },
        { expect: { visible: 'modal' } },
        { expect: { text: { blockId: 'title', notContains: 'Deleted' } } },
        { expect: { url: { contains: '/detail' } } },
        { expect: { dom: { blockId: 'submit', hasClass: 'ant-btn-primary' } } },
        { expect: { durationMsUnder: 2000 } },
      ],
    })
  ).toEqual({});
});

test('validateJourneySteps reports a located error for a malformed step', () => {
  expect(validateJourneySteps({ steps: [{ click: 'a' }, { fill: 'title' }] }).error).toEqual(
    'Step 1 "fill" requires { blockId, value }. Received "title".'
  );
});

test('getStepKey returns the single key of a step and undefined otherwise', () => {
  expect(getStepKey({ click: 'a' })).toEqual('click');
  expect(getStepKey({ click: 'a', press: 'Enter' })).toBeUndefined();
  expect(getStepKey('click')).toBeUndefined();
});
