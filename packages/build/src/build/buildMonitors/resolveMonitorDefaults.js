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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The only knobs an app has over the generated monitors. Deliberately two
// generic numbers rather than a per-monitor config surface: a monitor the app
// wants to shape by hand is a monitor the operator edits in their own tool,
// where the rest of their alerting already lives.
const monitorDefaults = {
  error_rate: 0.05,
  p95_ms: 2000,
  window_minutes: 5,
};

function resolveMonitorDefaults({ components }) {
  const monitors = components.logger?.monitors;
  if (type.isNone(monitors)) return { ...monitorDefaults };
  const configKey = monitors['~k'];
  if (!type.isObject(monitors)) {
    throw new ConfigError('App "logger.monitors" should be an object.', {
      received: monitors,
      configKey,
    });
  }
  const defaults = monitors.defaults;
  if (type.isNone(defaults)) return { ...monitorDefaults };
  if (!type.isObject(defaults)) {
    throw new ConfigError('App "logger.monitors.defaults" should be an object.', {
      received: defaults,
      configKey,
    });
  }
  const resolved = { ...monitorDefaults };
  if (!type.isNone(defaults.error_rate)) {
    if (
      typeof defaults.error_rate !== 'number' ||
      defaults.error_rate < 0 ||
      defaults.error_rate > 1
    ) {
      throw new ConfigError(
        'App "logger.monitors.defaults.error_rate" should be a number between 0 and 1.',
        { received: defaults.error_rate, configKey: defaults['~k'] ?? configKey }
      );
    }
    resolved.error_rate = defaults.error_rate;
  }
  if (!type.isNone(defaults.p95_ms)) {
    if (typeof defaults.p95_ms !== 'number' || defaults.p95_ms <= 0) {
      throw new ConfigError('App "logger.monitors.defaults.p95_ms" should be a positive number.', {
        received: defaults.p95_ms,
        configKey: defaults['~k'] ?? configKey,
      });
    }
    resolved.p95_ms = defaults.p95_ms;
  }
  return resolved;
}

export default resolveMonitorDefaults;
