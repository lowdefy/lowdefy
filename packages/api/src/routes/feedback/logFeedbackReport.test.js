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

import createAuthorizeOutcome from '../../context/createAuthorizeOutcome.js';
import logFeedbackReport from './logFeedbackReport.js';

const report = {
  text: 'The save button does nothing on this order.',
  page_id: 'orders',
  block_id: 'save_button',
  url: 'https://app.test/orders/1',
  session_id: 'sess-1',
};

function testContext({ events, user } = {}) {
  const logger = { debug: jest.fn(), info: jest.fn() };
  logger.eventsConfig = events;
  return {
    authorizeOutcome: createAuthorizeOutcome({ user }),
    logger,
    rid: 'rid-1',
    user,
  };
}

const user = { id: 'user-1', organization_id: 'org-1', roles: ['support'] };

test('logFeedbackReport emits one signed info feedback_submitted event', () => {
  const context = testContext({ user });
  const result = logFeedbackReport(context, { feedback: { enabled: true }, report });

  expect(result).toEqual({ status: 'ok' });
  expect(context.logger.debug).not.toHaveBeenCalled();
  expect(context.logger.info).toHaveBeenCalledTimes(1);
  expect(context.logger.info.mock.calls[0][0]).toEqual({
    event: 'feedback_submitted',
    rid: 'rid-1',
    text: 'The save button does nothing on this order.',
    page_id: 'orders',
    block_id: 'save_button',
    url: 'https://app.test/orders/1',
    session_id: 'sess-1',
    screenshot: null,
    user: { id: 'user-1' },
    org: 'org-1',
  });
});

test('logFeedbackReport signs the report even when logger.events.identity is off', () => {
  const context = testContext({ events: { identity: false, level: 'errors' }, user });
  logFeedbackReport(context, { feedback: { enabled: true }, report });

  expect(context.logger.info.mock.calls[0][0].user).toEqual({ id: 'user-1' });
});

test('logFeedbackReport refuses when the app has not enabled feedback', () => {
  const context = testContext({ user });

  expect(logFeedbackReport(context, { report })).toEqual({ status: 'disabled' });
  expect(logFeedbackReport(context, { feedback: { enabled: false }, report })).toEqual({
    status: 'disabled',
  });
  expect(context.logger.info).not.toHaveBeenCalled();
});

test('logFeedbackReport refuses an unauthenticated caller', () => {
  const context = testContext();
  const result = logFeedbackReport(context, { feedback: { enabled: true }, report });

  expect(result).toEqual({ status: 'forbidden' });
  expect(context.logger.info).not.toHaveBeenCalled();
});

test('logFeedbackReport accepts any authenticated caller when roles is empty', () => {
  const context = testContext({ user: { id: 'user-2', roles: [] } });
  const result = logFeedbackReport(context, { feedback: { enabled: true, roles: [] }, report });

  expect(result).toEqual({ status: 'ok' });
});

test('logFeedbackReport refuses a caller whose roles do not intersect feedback.roles', () => {
  const context = testContext({ user: { id: 'user-2', roles: ['viewer'] } });
  const result = logFeedbackReport(context, {
    feedback: { enabled: true, roles: ['support'] },
    report,
  });

  expect(result).toEqual({ status: 'forbidden' });
  expect(context.logger.info).not.toHaveBeenCalled();
});

test('logFeedbackReport accepts a caller holding one of feedback.roles', () => {
  const context = testContext({ user });
  const result = logFeedbackReport(context, {
    feedback: { enabled: true, roles: ['admin', 'support'] },
    report,
  });

  expect(result).toEqual({ status: 'ok' });
});

test('logFeedbackReport carries a screenshot data URL on the event', () => {
  const context = testContext({ user });
  const screenshot = `data:image/png;base64,${'A'.repeat(100)}`;
  logFeedbackReport(context, { feedback: { enabled: true }, report: { ...report, screenshot } });

  expect(context.logger.info.mock.calls[0][0].screenshot).toBe(screenshot);
});

test.each([
  ['a non-object report', 'nope'],
  ['a report with no text', { ...report, text: undefined }],
  ['a report with empty text', { ...report, text: '' }],
  ['a report whose text is over 4000 characters', { ...report, text: 'x'.repeat(4001) }],
  ['a report with no page_id', { ...report, page_id: undefined }],
  ['a report whose block_id is not a string', { ...report, block_id: 12 }],
  [
    'a report whose screenshot is not a data URL',
    { ...report, screenshot: 'https://a.test/a.png' },
  ],
  [
    'a report whose screenshot is over 256 KB',
    { ...report, screenshot: `data:image/png;base64,${'A'.repeat(256 * 1024)}` },
  ],
])('logFeedbackReport reports %s as invalid and logs nothing', (_, invalid) => {
  const context = testContext({ user });
  const result = logFeedbackReport(context, {
    feedback: { enabled: true },
    report: invalid,
  });

  expect(result.status).toBe('invalid');
  expect(context.logger.info).not.toHaveBeenCalled();
});
