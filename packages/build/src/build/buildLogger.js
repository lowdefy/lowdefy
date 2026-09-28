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

const sentryDefaults = {
  client: true,
  server: true,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
  feedback: false,
  userFields: ['id', '_id'],
};

// Runs after validateConfig, so config.environment and config.environments are resolved.
function buildLogger({ components }) {
  if (type.isNone(components.logger)) {
    components.logger = {};
  }
  const current = components.config.environment;

  // Sentry is enabled by SENTRY_DSN, not by the config being present, so a current environment
  // creates the Sentry config to carry its name. Without either, the runtime defaults apply.
  if (type.isNone(components.logger.sentry) && type.isNone(current)) {
    return components;
  }
  const sentry = {
    ...sentryDefaults,
    ...(components.logger.sentry ?? {}),
  };
  if (!type.isNone(current)) {
    // Sentry reports under the environment name unless the app names one itself, and is off on
    // both sides when the environment switches it off.
    if (type.isNone(sentry.environment)) {
      sentry.environment = current;
    }
    if (components.config.environments?.[current]?.sentry?.enabled === false) {
      sentry.client = false;
      sentry.server = false;
    }
  }
  components.logger.sentry = sentry;

  return components;
}

export default buildLogger;
