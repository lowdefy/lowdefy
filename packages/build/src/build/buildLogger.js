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

// Wide events (request_completed, step_completed, endpoint_completed,
// agent_tool_completed and their failed twins) are always emitted; the policy
// decides at which level. The default keeps a production log at the volume it
// has today: failures only, and no identity fields on a per-step line.
const eventsDefaults = {
  level: 'errors',
  identity: false,
};

// The journey recorder is on by default; volume is the only reason to turn it
// down. Sampling is per session, so a recorded session is a complete story -
// raising the rate is how an app fills its journey corpus faster. The dev
// server records every session regardless of this rate.
const journeysDefaults = {
  enabled: true,
  sample_rate: 0.05,
};

const otlpBatchDefaults = {
  size: 50,
  flush_ms: 2000,
};

function resolveEvents(events) {
  if (type.isString(events)) {
    return { ...eventsDefaults, level: events };
  }
  if (type.isObject(events)) {
    return { ...eventsDefaults, ...events };
  }
  return { ...eventsDefaults };
}

function buildLogger({ components }) {
  if (type.isNone(components.logger)) {
    components.logger = {};
  }

  // Always written, so the runtime reads a policy instead of defaulting one.
  components.logger.events = resolveEvents(components.logger.events);

  // Always written, so the client reads a policy instead of defaulting one.
  components.logger.journeys = { ...journeysDefaults, ...components.logger.journeys };

  // The OTLP exporter is off unless an endpoint is configured. Header values
  // are left exactly as authored - a "_secret" operator node stays an operator
  // node, so a token is never written into the build artifact; the server
  // resolves it against its own secrets when it creates the logger.
  if (!type.isNone(components.logger.otlp)) {
    components.logger.otlp = {
      headers: {},
      resource: {},
      ...components.logger.otlp,
      batch: { ...otlpBatchDefaults, ...components.logger.otlp.batch },
    };
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
