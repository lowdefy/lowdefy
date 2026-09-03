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

import { jest } from '@jest/globals';

import resolveRunAs from './resolveRunAs.js';

const evaluateOperators = jest.fn(() => 'org_1');
const context = { evaluateOperators };

const routineContext = {
  items: { row: 1 },
  payload: { organizationId: 'org_intruder' },
  state: { organizationId: 'org_state' },
  steps: { job: { organization_id: 'org_step' } },
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('resolveRunAs returns undefined when no runAs is declared', () => {
  expect(resolveRunAs(context, routineContext, { runAs: undefined })).toBeUndefined();
  expect(resolveRunAs(context, routineContext, { runAs: null })).toBeUndefined();
  expect(evaluateOperators).not.toHaveBeenCalled();
});

test('resolveRunAs evaluates an endpoint-level runAs with an empty payload', () => {
  const runAs = resolveRunAs(context, routineContext, {
    runAs: { organizationId: { _secret: 'SYSTEM_ORG' } },
    location: 'jobs',
    configKey: 'endpoint.1',
    source: 'endpoint',
  });
  expect(evaluateOperators).toHaveBeenCalledWith({
    input: { _secret: 'SYSTEM_ORG' },
    items: routineContext.items,
    location: 'jobs',
    payload: {},
    state: routineContext.state,
    steps: routineContext.steps,
  });
  expect(runAs).toEqual({ organizationId: 'org_1', configKey: 'endpoint.1', source: 'endpoint' });
});

test('resolveRunAs evaluates a step-level runAs against the routine context as it stands', () => {
  resolveRunAs(context, routineContext, {
    runAs: { organizationId: { _step: 'job.organization_id' } },
    location: 'rows',
    configKey: 'step.1',
    source: 'step',
  });
  expect(evaluateOperators.mock.calls[0][0].payload).toBe(routineContext.payload);
  expect(evaluateOperators.mock.calls[0][0].steps).toBe(routineContext.steps);
});
