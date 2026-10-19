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

// config.dependencyTracking: false makes the client evaluate every block on every update. The
// browser reads it from app metadata (lowdefy.lowdefyApp), which already reaches the client, so
// only the opt-out is written: the default leaves appMeta unchanged.
function buildDependencyTracking({ components }) {
  const { dependencyTracking } = components.config;
  if (type.isUndefined(dependencyTracking)) {
    return components;
  }
  if (!type.isBoolean(dependencyTracking)) {
    throw new ConfigError('App "config.dependencyTracking" should be a boolean.', {
      received: dependencyTracking,
      configKey: components.config['~k'],
    });
  }
  if (dependencyTracking === false && type.isObject(components.appMeta)) {
    components.appMeta.dependencyTracking = false;
  }
  return components;
}

export default buildDependencyTracking;
