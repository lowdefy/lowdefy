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

// Features an app opts in to under config.experimental. Each may change in a minor release.
const EXPERIMENTAL_FEATURES = ['mobile'];

// config.experimental opts an app in to features that are not yet stable. The build reads the
// opt-ins from context.experimental (a dev page build restores them from config.json), so a step
// can refuse an experimental key the app did not opt in to.
function buildExperimental({ components, context }) {
  const { experimental } = components.config;
  context.experimental = {};
  if (type.isNone(experimental)) {
    return components;
  }
  const configKey = experimental['~k'] ?? components.config['~k'];
  if (!type.isObject(experimental)) {
    throw new ConfigError('App "config.experimental" should be an object.', {
      received: experimental,
      configKey,
    });
  }
  Object.keys(experimental).forEach((name) => {
    if (name.startsWith('~')) {
      return;
    }
    if (!EXPERIMENTAL_FEATURES.includes(name)) {
      throw new ConfigError(
        `App "config.experimental.${name}" is not an experimental feature. The experimental features are ${EXPERIMENTAL_FEATURES.map(
          (feature) => `"${feature}"`
        ).join(', ')}.`,
        { configKey }
      );
    }
    if (!type.isBoolean(experimental[name])) {
      throw new ConfigError(`App "config.experimental.${name}" should be a boolean.`, {
        received: experimental[name],
        configKey,
      });
    }
    context.experimental[name] = experimental[name];
  });
  return components;
}

export { EXPERIMENTAL_FEATURES };
export default buildExperimental;
