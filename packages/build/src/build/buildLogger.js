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

function buildLogger({ components }) {
  if (type.isNone(components.logger)) {
    components.logger = {};
  }

  // Only apply defaults if sentry is explicitly configured
  if (!type.isNone(components.logger.sentry)) {
    components.logger.sentry = {
      ...sentryDefaults,
      ...components.logger.sentry,
    };
  }

  return components;
}

export default buildLogger;
