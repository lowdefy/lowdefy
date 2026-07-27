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

import validateRenderReportSteps from './validateRenderReportSteps.js';
import testContext from '../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const logger = { warn: mockLogWarn };

function renderReportStep(properties = { pageId: 'sales_dashboard' }) {
  return {
    id: 'report:monthly_sales_report:report',
    stepId: 'report',
    endpointId: 'monthly_sales_report',
    type: 'RenderReport',
    properties,
  };
}

function scheduledEndpoint(routine) {
  return {
    endpointId: 'monthly_sales_report',
    type: 'InternalApi',
    schedules: [{ cron: '0 6 1 * *', payload: { region: 'emea' } }],
    routine,
  };
}

// A page that greets the signed-in user — the _user operator sits deep in the
// block tree, where the operator count finds it.
function userPage() {
  return {
    pageId: 'sales_dashboard',
    blocks: [
      {
        blockId: 'greeting',
        type: 'Paragraph',
        properties: { content: { _user: 'name' } },
      },
    ],
  };
}

function plainPage() {
  return {
    pageId: 'sales_dashboard',
    blocks: [{ blockId: 'title', type: 'Paragraph', properties: { content: 'Sales' } }],
  };
}

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('warns when a scheduled endpoint renders a static page that uses _user', () => {
  const context = testContext({ logger });
  const components = {
    api: [scheduledEndpoint([renderReportStep()])],
    pages: [userPage()],
  };
  validateRenderReportSteps({ components, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toEqual(
    'RenderReport step "report" at scheduled endpoint "monthly_sales_report" renders page "sales_dashboard" which uses _user. Scheduled runs have no user, so the render will fail — pass explicit parameters via the schedule payload instead.'
  );
});

test('no warning when the rendered page does not use _user', () => {
  const context = testContext({ logger });
  const components = {
    api: [scheduledEndpoint([renderReportStep()])],
    pages: [plainPage()],
  };
  validateRenderReportSteps({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('no warning when the endpoint has no schedules', () => {
  const context = testContext({ logger });
  const components = {
    api: [{ endpointId: 'email_sales_report', type: 'Api', routine: [renderReportStep()] }],
    pages: [userPage()],
  };
  validateRenderReportSteps({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('no warning for an operator pageId — it falls through to the runtime error', () => {
  const context = testContext({ logger });
  const components = {
    api: [scheduledEndpoint([renderReportStep({ pageId: { _payload: 'pageId' } })])],
    pages: [userPage()],
  };
  validateRenderReportSteps({ components, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('finds RenderReport steps nested in control structures', () => {
  const context = testContext({ logger });
  const components = {
    api: [scheduledEndpoint([{ ':if': { _payload: 'send' }, ':then': [renderReportStep()] }])],
    pages: [userPage()],
  };
  validateRenderReportSteps({ components, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
});

test('a page using _user only in a request payload also warns', () => {
  const context = testContext({ logger });
  const components = {
    api: [scheduledEndpoint([renderReportStep()])],
    pages: [
      {
        pageId: 'sales_dashboard',
        requests: [{ requestId: 'getData', payload: { account: { _user: 'account_id' } } }],
        blocks: [{ blockId: 'title', type: 'Paragraph', properties: { content: 'Sales' } }],
      },
    ],
  };
  validateRenderReportSteps({ components, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
});

test('returns components unchanged when there are no scheduled endpoints', () => {
  const context = testContext({ logger });
  const components = { api: [], pages: [userPage()] };
  expect(validateRenderReportSteps({ components, context })).toBe(components);
});
