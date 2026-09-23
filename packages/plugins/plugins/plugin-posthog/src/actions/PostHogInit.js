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

const defaultApiHost = 'https://us.i.posthog.com';

// Initialise posthog-js. Every other action in this package does nothing until
// it has run, so run it from the onInit event of every page, shared with _ref.
// Calling it again with the same apiKey does nothing, which is what makes that
// safe.
async function PostHogInit({ params }) {
  if (!type.isObject(params)) {
    throw new Error(`PostHogInit params must be an object. Received ${JSON.stringify(params)}.`);
  }
  const { apiKey, apiHost, debug, enabled, options } = params;

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

  // A disabled deployment never talks to PostHog, so it does not need a key.
  if (enabled !== false && (!type.isString(apiKey) || apiKey.trim() === '')) {
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

  await initPostHog({ apiKey: apiKey ?? null, config, enabled });
  return null;
}

export default PostHogInit;
