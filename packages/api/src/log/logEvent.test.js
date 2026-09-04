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

import logEvent from './logEvent.js';
import reportingSessions from './reportingSessions.js';

function testContext({ eventsConfig, rid = 'rid_1', user = { id: 'user_1' } } = {}) {
  return {
    rid,
    user,
    pageId: 'page_1',
    blockId: 'block_1',
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      eventsConfig,
    },
  };
}

test('logEvent writes one debug line with the context identifiers by default', () => {
  const context = testContext();
  logEvent({
    context,
    event: 'step_completed',
    fields: { endpoint_id: 'ep_1', step_id: 'step_1', config_key: 'k1', duration_ms: 12 },
  });
  expect(context.logger.info).not.toHaveBeenCalled();
  expect(context.logger.debug.mock.calls).toEqual([
    [
      {
        event: 'step_completed',
        rid: 'rid_1',
        page_id: 'page_1',
        block_id: 'block_1',
        endpoint_id: 'ep_1',
        step_id: 'step_1',
        config_key: 'k1',
        duration_ms: 12,
      },
    ],
  ]);
});

test('logEvent omits user and org unless identity is enabled', () => {
  const context = testContext();
  logEvent({ context, event: 'request_completed', fields: { org: 'org_1' } });
  const [line] = context.logger.debug.mock.calls[0];
  expect(line.user).toBeUndefined();
  expect(line.org).toBeUndefined();
});

test('logEvent writes user.id and org when identity is enabled', () => {
  const context = testContext({ eventsConfig: { identity: true } });
  logEvent({ context, event: 'request_completed', fields: { org: 'org_1' } });
  const [line] = context.logger.debug.mock.calls[0];
  expect(line.user).toEqual({ id: 'user_1' });
  expect(line.org).toEqual('org_1');
});

test('logEvent writes user.id as null when identity is enabled and there is no caller', () => {
  const context = testContext({ eventsConfig: { identity: true }, user: null });
  logEvent({ context, event: 'request_completed', fields: {} });
  const [line] = context.logger.debug.mock.calls[0];
  expect(line.user).toEqual({ id: null });
});

test('logEvent writes a success line at info when logger.events is all', () => {
  const context = testContext({ eventsConfig: 'all' });
  logEvent({ context, event: 'endpoint_completed', fields: {} });
  expect(context.logger.debug).not.toHaveBeenCalled();
  expect(context.logger.info).toHaveBeenCalled();
});

test('logEvent writes a success line at info when the object form sets level all', () => {
  const context = testContext({ eventsConfig: { level: 'all' } });
  logEvent({ context, event: 'endpoint_completed', fields: {} });
  expect(context.logger.info).toHaveBeenCalled();
});

test('logEvent always writes a failed event at info', () => {
  const context = testContext();
  const error = Object.assign(new Error('nope'), { name: 'RequestError', hint: 'try again' });
  logEvent({ context, event: 'request_failed', fields: { success: false, error } });
  expect(context.logger.debug).not.toHaveBeenCalled();
  const [line, message] = context.logger.info.mock.calls[0];
  expect(line.error).toEqual({ name: 'RequestError', message: 'nope', hint: 'try again' });
  expect(line.err).toBe(error);
  expect(message).toEqual('nope');
});

test('logEvent keeps every event of a sampled request and drops every event of one that is not', () => {
  const eventsConfig = { sample_rate: 0.5 };
  const rids = Array.from(
    { length: 12 },
    (_, index) => `8f14e45f-ea8d-4c6b-9f1a-00000000000${index.toString(16)}`
  );
  const decisions = rids.map((rid) => {
    const context = testContext({ eventsConfig, rid });
    logEvent({ context, event: 'request_completed', fields: {} });
    logEvent({ context, event: 'step_completed', fields: {} });
    return {
      rid,
      info: context.logger.info.mock.calls.length,
      debug: context.logger.debug.mock.calls.length,
    };
  });
  // Both lines of a request land at the same level - never one of each.
  decisions.forEach(({ info, debug }) => {
    expect(info + debug).toEqual(2);
    expect([0, 2]).toContain(info);
  });
  expect(decisions.some(({ info }) => info === 2)).toBe(true);
  expect(decisions.some(({ debug }) => debug === 2)).toBe(true);
});

test('logEvent writes every success at info when sample_rate is 1', () => {
  const context = testContext({ eventsConfig: { sample_rate: 1 } });
  logEvent({ context, event: 'agent_tool_completed', fields: {} });
  expect(context.logger.info).toHaveBeenCalled();
});

test('logEvent writes no success at info when sample_rate is 0', () => {
  const context = testContext({ eventsConfig: { sample_rate: 0 } });
  logEvent({ context, event: 'agent_tool_completed', fields: {} });
  expect(context.logger.info).not.toHaveBeenCalled();
  expect(context.logger.debug).toHaveBeenCalled();
});

test('logEvent keeps a sampled-out event whose session reported feedback', () => {
  const context = testContext({ eventsConfig: { sample_rate: 0 } });
  logEvent({
    context,
    event: 'journey_event',
    fields: { session_id: 'sess-not-reporting' },
  });
  expect(context.logger.info).not.toHaveBeenCalled();

  reportingSessions.keep('sess-reporting');
  const reporting = testContext({ eventsConfig: { sample_rate: 0 } });
  logEvent({
    context: reporting,
    event: 'journey_event',
    fields: { session_id: 'sess-reporting' },
  });
  expect(reporting.logger.info).toHaveBeenCalled();
  expect(reporting.logger.debug).not.toHaveBeenCalled();
});
