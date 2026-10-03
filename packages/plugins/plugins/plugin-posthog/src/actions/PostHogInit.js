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

import initPostHog from '../lib/initPostHog.js';
import postHogState from '../lib/postHogState.js';
import subscribeEventFailures from '../lib/subscribeEventFailures.js';

const defaultApiHost = 'https://us.i.posthog.com';
// Whether lowdefy_event_failed is captured when captureEventFailures is not set.
const defaultCaptureEventFailures = true;

// Initialise posthog-js. Every other action in this package does nothing until
// it has run, so run it from the app's events.onInitAsync, which runs once per
// app load. Calling it again with the same apiKey does nothing, so a per-page
// placement is safe too. The deployment environment (config.environments /
// LOWDEFY_ENVIRONMENT), build id and app version are registered as super
// properties, so every event carries them. Events are enriched with Lowdefy
// semantics, and failed block and app events are captured as
// lowdefy_event_failed unless captureEventFailures is false.
async function PostHogInit({ params, lowdefyApp, trace }) {
  if (!type.isObject(params)) {
    throw new Error(`PostHogInit params must be an object. Received ${JSON.stringify(params)}.`);
  }
  const { apiKey, apiHost, captureEventFailures, debug, enabled, options } = params;

  if (!type.isNone(enabled) && !type.isBoolean(enabled)) {
    throw new Error(
      `PostHogInit "enabled" must be a boolean. Received ${JSON.stringify(enabled)}.`
    );
  }
  if (!type.isNone(options) && !type.isObject(options)) {
    throw new Error(
      `PostHogInit "options" must be an object. Received ${JSON.stringify(options)}.`
    );
  }
  if (!type.isNone(apiHost) && (!type.isString(apiHost) || apiHost.trim() === '')) {
    throw new Error(
      `PostHogInit "apiHost" must be a non-empty string. Received ${JSON.stringify(apiHost)}.`
    );
  }
  if (!type.isNone(debug) && !type.isBoolean(debug)) {
    throw new Error(`PostHogInit "debug" must be a boolean. Received ${JSON.stringify(debug)}.`);
  }
  if (!type.isNone(captureEventFailures) && !type.isBoolean(captureEventFailures)) {
    throw new Error(
      `PostHogInit "captureEventFailures" must be a boolean. Received ${JSON.stringify(
        captureEventFailures
      )}.`
    );
  }

  // A disabled deployment never talks to PostHog, so it does not need a key.
  // The current environment can switch PostHog off (config.environments.<env>.posthog.enabled:
  // false). That wins over the enabled param, and a switched-off deployment needs no key.
  const environmentOff = (lowdefyApp?.disabled ?? []).includes('posthog');
  if (enabled !== false && !environmentOff && (!type.isString(apiKey) || apiKey.trim() === '')) {
    throw new Error(
      `PostHogInit "apiKey" must be a non-empty string. Received ${JSON.stringify(apiKey)}.`
    );
  }

  const initOptions = options ?? {};
  const config = {
    ...initOptions,
    api_host: apiHost ?? initOptions.api_host ?? defaultApiHost,
  };
  if (type.isBoolean(debug)) {
    config.debug = debug;
  }

  const superProperties = {};
  if (!type.isNone(lowdefyApp?.environment)) {
    superProperties.environment = lowdefyApp.environment;
  }
  // A config key (~k) is a per-build id, so the build id is what maps one back to its source.
  if (!type.isNone(lowdefyApp?.buildId)) {
    superProperties.lowdefy_build_id = lowdefyApp.buildId;
  }
  if (!type.isNone(lowdefyApp?.version)) {
    superProperties.lowdefy_app_version = lowdefyApp.version;
  }
  // Read by the before_send hook, which posthog-js calls for every event.
  postHogState.trace = trace;
  await initPostHog({
    apiKey: apiKey ?? null,
    config,
    enabled: environmentOff ? false : enabled,
    superProperties,
  });
  if (
    postHogState.status === 'enabled' &&
    (captureEventFailures ?? defaultCaptureEventFailures) === true
  ) {
    subscribeEventFailures({ trace });
  }
  return null;
}

export default PostHogInit;
