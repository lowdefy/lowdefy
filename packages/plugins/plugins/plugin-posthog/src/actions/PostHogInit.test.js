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

import enrichEvent from '../lib/enrichEvent.js';
import postHogState from '../lib/postHogState.js';
import createFakeTrace from '../test/createFakeTrace.js';
import resetPostHogState from '../test/resetPostHogState.js';

const mockPostHog = {
  capture: jest.fn(),
  init: jest.fn(),
  register: jest.fn(),
};

jest.unstable_mockModule('posthog-js', () => ({ default: mockPostHog }));

let PostHogCapture;
let warn;
let PostHogInit;

beforeEach(async () => {
  resetPostHogState();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  ({ PostHogCapture, PostHogInit } = await import('../actions.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('PostHogInit initialises posthog-js with the default api host', async () => {
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } })
  ).resolves.toBe(null);
  expect(mockPostHog.init.mock.calls).toEqual([
    ['phc_key', { api_host: 'https://us.i.posthog.com', before_send: enrichEvent }],
  ]);
  expect(postHogState.status).toBe('enabled');
});

test('PostHogInit passes apiHost, options and debug to posthog-js', async () => {
  await PostHogInit({
    trace: createFakeTrace(),
    params: {
      apiKey: 'phc_key',
      apiHost: 'https://eu.i.posthog.com',
      debug: true,
      options: { capture_pageview: 'history_change', person_profiles: 'identified_only' },
    },
  });
  expect(mockPostHog.init.mock.calls).toEqual([
    [
      'phc_key',
      {
        api_host: 'https://eu.i.posthog.com',
        before_send: enrichEvent,
        capture_pageview: 'history_change',
        debug: true,
        person_profiles: 'identified_only',
      },
    ],
  ]);
});

test('PostHogInit does nothing when called again with the same apiKey', async () => {
  await PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } });
  await PostHogInit({
    trace: createFakeTrace(),
    params: { apiKey: 'phc_key', options: { autocapture: false } },
  });
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
});

test('PostHogInit initialises once when called twice before loading finishes', async () => {
  await Promise.all([
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } }),
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } }),
  ]);
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
});

test('PostHog actions wait for a PostHogInit that is still loading', async () => {
  const init = PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } });
  await PostHogCapture({ params: { event: 'report_submitted' } });
  await init;
  expect(mockPostHog.capture.mock.calls).toEqual([['report_submitted', {}]]);
  expect(warn).not.toHaveBeenCalled();
});

test('PostHogInit throws when called again with a different apiKey', async () => {
  await PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } });
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_other' } })
  ).rejects.toThrow(
    'PostHogInit was already called with a different "apiKey". PostHog can only be initialised once per browser session. Received "phc_other".'
  );
});

test('PostHogInit makes the other actions silent no-ops when enabled is false', async () => {
  await expect(PostHogInit({ trace: createFakeTrace(), params: { enabled: false } })).resolves.toBe(
    null
  );
  expect(mockPostHog.init).not.toHaveBeenCalled();
  expect(postHogState.status).toBe('disabled');
  await expect(PostHogCapture({ params: { event: 'report_submitted' } })).resolves.toBe(null);
  expect(mockPostHog.capture).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});

test('PostHogInit does not require apiKey when enabled is false', async () => {
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: null, enabled: false } })
  ).resolves.toBe(null);
});

test('PostHogInit loads PostHog when called with an apiKey after enabled is false', async () => {
  await PostHogInit({ trace: createFakeTrace(), params: { enabled: false } });
  await PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } });
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
  expect(postHogState.status).toBe('enabled');
});

test('PostHogInit throws when called with enabled false after PostHog was initialised', async () => {
  await PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key' } });
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { enabled: false } })
  ).rejects.toThrow(
    'PostHogInit was called with "enabled: false" after PostHog was already initialised.'
  );
});

test('PostHogInit throws when apiKey is missing', async () => {
  await expect(PostHogInit({ trace: createFakeTrace(), params: {} })).rejects.toThrow(
    'PostHogInit "apiKey" must be a non-empty string. Received undefined.'
  );
});

test('PostHogInit throws when apiKey is an empty string', async () => {
  await expect(PostHogInit({ trace: createFakeTrace(), params: { apiKey: '  ' } })).rejects.toThrow(
    'PostHogInit "apiKey" must be a non-empty string. Received "  ".'
  );
});

test('PostHogInit throws when params is not an object', async () => {
  await expect(PostHogInit({ trace: createFakeTrace(), params: 'phc_key' })).rejects.toThrow(
    'PostHogInit params must be an object. Received "phc_key".'
  );
});

test('PostHogInit throws when options is not an object', async () => {
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key', options: 'autocapture' } })
  ).rejects.toThrow('PostHogInit "options" must be an object. Received "autocapture".');
});

test('PostHogInit throws when enabled is not a boolean', async () => {
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key', enabled: 'false' } })
  ).rejects.toThrow('PostHogInit "enabled" must be a boolean. Received "false".');
});

test('PostHogInit throws when apiHost is not a string', async () => {
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key', apiHost: 1 } })
  ).rejects.toThrow('PostHogInit "apiHost" must be a non-empty string. Received 1.');
});

test('PostHogInit throws when apiHost is an empty string', async () => {
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key', apiHost: '' } })
  ).rejects.toThrow('PostHogInit "apiHost" must be a non-empty string. Received "".');
});

test('PostHogInit throws when debug is not a boolean', async () => {
  await expect(
    PostHogInit({ trace: createFakeTrace(), params: { apiKey: 'phc_key', debug: 'yes' } })
  ).rejects.toThrow('PostHogInit "debug" must be a boolean. Received "yes".');
});

test('PostHogInit registers the deployment environment as a super property', async () => {
  await PostHogInit({
    trace: createFakeTrace(),
    params: { apiKey: 'phc_key' },
    lowdefyApp: { name: 'app', environment: 'staging' },
  });
  expect(mockPostHog.register.mock.calls).toEqual([[{ environment: 'staging' }]]);
});

test('PostHogInit registers no super property without an environment', async () => {
  await PostHogInit({
    trace: createFakeTrace(),
    params: { apiKey: 'phc_key' },
    lowdefyApp: { name: 'app' },
  });
  expect(mockPostHog.register).not.toHaveBeenCalled();
});

test('PostHogInit stays disabled, without an apiKey, when the environment switches PostHog off', async () => {
  await expect(
    PostHogInit({
      trace: createFakeTrace(),
      params: { enabled: true },
      lowdefyApp: { environment: 'preview', disabled: ['posthog'] },
    })
  ).resolves.toBe(null);
  expect(mockPostHog.init).not.toHaveBeenCalled();
  expect(postHogState.status).toBe('disabled');
});

test('PostHogInit registers the build id and app version as super properties', async () => {
  await PostHogInit({
    trace: createFakeTrace(),
    params: { apiKey: 'phc_key' },
    lowdefyApp: { buildId: 'build-1', environment: 'production', version: '2.4.0' },
  });
  expect(mockPostHog.register.mock.calls).toEqual([
    [{ environment: 'production', lowdefy_app_version: '2.4.0', lowdefy_build_id: 'build-1' }],
  ]);
});

test('PostHogInit stores the trace registry for the before_send hook', async () => {
  const trace = createFakeTrace();
  await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  expect(postHogState.trace).toBe(trace);
});

test('PostHogInit throws when captureEventFailures is not a boolean', async () => {
  await expect(
    PostHogInit({
      trace: createFakeTrace(),
      params: { apiKey: 'phc_key', captureEventFailures: 'no' },
    })
  ).rejects.toThrow('PostHogInit "captureEventFailures" must be a boolean. Received "no".');
});

function failedPayload(overrides = {}) {
  return {
    scope: 'page',
    pageId: 'orders',
    blockId: 'save_button',
    blockType: 'Button',
    eventName: 'onClick',
    success: false,
    failure: {
      actionId: 'validate',
      actionType: 'Validate',
      configKey: 'key-1',
      errorName: 'UserError',
      invalidBlocks: ['name', 'email'],
    },
    debounceMs: 0,
    record: { startTimestamp: new Date('2026-10-03T10:00:00.000Z') },
    ...overrides,
  };
}

test('PostHogInit captures a failed event as lowdefy_event_failed at its start time', async () => {
  const trace = createFakeTrace();
  await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  trace.emit(failedPayload({ debounceMs: 300 }));
  expect(mockPostHog.capture.mock.calls).toEqual([
    [
      'lowdefy_event_failed',
      {
        lowdefy_event_scope: 'page',
        lowdefy_page_id: 'orders',
        lowdefy_block_id: 'save_button',
        lowdefy_block_type: 'Button',
        lowdefy_event_name: 'onClick',
        lowdefy_debounce_ms: 300,
        lowdefy_action_id: 'validate',
        lowdefy_action_type: 'Validate',
        lowdefy_error_name: 'UserError',
        lowdefy_config_key: 'key-1',
        lowdefy_invalid_blocks: ['name', 'email'],
      },
      { timestamp: new Date('2026-10-03T10:00:00.000Z') },
    ],
  ]);
});

test('PostHogInit leaves the block type out of an app event failure and empty invalid blocks', async () => {
  const trace = createFakeTrace();
  await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  trace.emit(
    failedPayload({
      scope: 'app',
      blockId: 'app',
      blockType: null,
      eventName: 'onInit',
      failure: {
        actionId: 'settings',
        actionType: 'CallAPI',
        configKey: 'key-2',
        errorName: 'RequestError',
        invalidBlocks: [],
      },
    })
  );
  const [[, properties]] = mockPostHog.capture.mock.calls;
  expect(properties).toEqual({
    lowdefy_event_scope: 'app',
    lowdefy_page_id: 'orders',
    lowdefy_block_id: 'app',
    lowdefy_event_name: 'onInit',
    lowdefy_debounce_ms: 0,
    lowdefy_action_id: 'settings',
    lowdefy_action_type: 'CallAPI',
    lowdefy_error_name: 'RequestError',
    lowdefy_config_key: 'key-2',
  });
});

test('PostHogInit captures nothing for a successful event', async () => {
  const trace = createFakeTrace();
  await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  trace.emit(failedPayload({ success: true, failure: null }));
  expect(mockPostHog.capture).not.toHaveBeenCalled();
});

test('PostHogInit called on every page with one registry leaves one listener', async () => {
  const trace = createFakeTrace();
  for (let page = 0; page < 5; page += 1) {
    await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  }
  expect(trace.listeners).toHaveLength(1);
  trace.emit(failedPayload());
  expect(mockPostHog.capture).toHaveBeenCalledTimes(1);
});

test('PostHogInit captures at most 50 failures per app load', async () => {
  const trace = createFakeTrace();
  await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  for (let failure = 0; failure < 51; failure += 1) {
    trace.emit(failedPayload());
  }
  expect(mockPostHog.capture).toHaveBeenCalledTimes(50);
});

test("PostHogInit captures a failure emitted before it subscribed, at that failure's start time", async () => {
  const trace = createFakeTrace();
  trace.emit(
    failedPayload({
      scope: 'app',
      blockId: 'app',
      blockType: null,
      eventName: 'onInit',
      record: { startTimestamp: new Date('2026-10-03T09:59:00.000Z') },
    })
  );
  trace.emit(failedPayload({ success: true, failure: null }));
  await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  expect(trace.subscribe).toHaveBeenCalledWith(expect.any(Function), { replay: true });
  expect(mockPostHog.capture).toHaveBeenCalledTimes(1);
  const [[name, properties, options]] = mockPostHog.capture.mock.calls;
  expect(name).toBe('lowdefy_event_failed');
  expect(properties).toMatchObject({
    lowdefy_event_scope: 'app',
    lowdefy_block_id: 'app',
    lowdefy_event_name: 'onInit',
  });
  expect(options).toEqual({ timestamp: new Date('2026-10-03T09:59:00.000Z') });
  expect(postHogState.subscription.trace).toBe(trace);
  expect(typeof postHogState.subscription.unsubscribe).toBe('function');
  expect(postHogState.subscription.count).toBe(1);
});

test('PostHogInit counts replayed failures toward the 50 per app load', async () => {
  const trace = createFakeTrace();
  for (let failure = 0; failure < 10; failure += 1) {
    trace.emit(failedPayload());
  }
  await PostHogInit({ trace, params: { apiKey: 'phc_key' } });
  for (let failure = 0; failure < 41; failure += 1) {
    trace.emit(failedPayload());
  }
  expect(mockPostHog.capture).toHaveBeenCalledTimes(50);
});

test('PostHogInit with a different registry replaces the failure listener', async () => {
  const first = createFakeTrace();
  const second = createFakeTrace();
  await PostHogInit({ trace: first, params: { apiKey: 'phc_key' } });
  await PostHogInit({ trace: second, params: { apiKey: 'phc_key' } });
  expect(first.listeners).toHaveLength(0);
  expect(second.listeners).toHaveLength(1);
});

test('PostHogInit subscribes nothing when captureEventFailures is false', async () => {
  const trace = createFakeTrace();
  await PostHogInit({ trace, params: { apiKey: 'phc_key', captureEventFailures: false } });
  expect(trace.subscribe).not.toHaveBeenCalled();
  expect(mockPostHog.init).toHaveBeenCalledTimes(1);
});

test('PostHogInit subscribes nothing when PostHog is disabled', async () => {
  const trace = createFakeTrace();
  await PostHogInit({ trace, params: { enabled: false } });
  expect(trace.subscribe).not.toHaveBeenCalled();
  expect(mockPostHog.init).not.toHaveBeenCalled();
});

test('PostHogInit loads nothing and subscribes nothing when the environment switches PostHog off', async () => {
  const trace = createFakeTrace();
  await PostHogInit({
    trace,
    params: { apiKey: 'phc_key' },
    lowdefyApp: { environment: 'preview', disabled: ['posthog'] },
  });
  expect(trace.subscribe).not.toHaveBeenCalled();
  expect(mockPostHog.init).not.toHaveBeenCalled();
});
