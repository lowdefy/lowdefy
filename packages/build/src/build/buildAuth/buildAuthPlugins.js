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
import { ConfigError } from '@lowdefy/errors/build';

import collectExceptions from '../../utils/collectExceptions.js';

function buildAuthPlugin({ counter, pluginConfig, typeClass, context }) {
  if (type.isArray(pluginConfig)) {
    pluginConfig.forEach((plugin) => {
      const configKey = plugin['~k'];
      if (type.isUndefined(plugin.id)) {
        collectExceptions(
          context,
          new ConfigError({ message: `Auth ${typeClass} id missing.`, configKey, context })
        );
        return;
      }
      if (!type.isString(plugin.id)) {
        collectExceptions(
          context,
          new ConfigError({
            message: `Auth ${typeClass} id is not a string.`,
            received: plugin.id,
            configKey,
            context,
          })
        );
        return;
      }
      if (!type.isString(plugin.type)) {
        collectExceptions(
          context,
          new ConfigError({
            message: `Auth ${typeClass} type is not a string at ${typeClass} "${plugin.id}".`,
            received: plugin.type,
            configKey,
            context,
          })
        );
        return;
      }
      counter.increment(plugin.type, plugin['~k']);
    });
  }
}

function buildAdapter({ components, context }) {
  const { adapter } = components.auth;
  if (type.isNone(adapter)) {
    return;
  }
  const configKey = adapter['~k'];
  if (type.isUndefined(adapter.id)) {
    collectExceptions(
      context,
      new ConfigError({ message: 'Auth adapter id missing.', configKey, context })
    );
    return;
  }
  if (!type.isString(adapter.id)) {
    collectExceptions(
      context,
      new ConfigError({
        message: `Auth adapter id is not a string.`,
        received: adapter.id,
        configKey,
        context,
      })
    );
    return;
  }
  if (!type.isString(adapter.type)) {
    collectExceptions(
      context,
      new ConfigError({
        message: `Auth adapter type is not a string at adapter "${adapter.id}".`,
        received: adapter.type,
        configKey,
        context,
      })
    );
    return;
  }
  context.typeCounters.auth.adapters.increment(adapter.type, adapter['~k']);
}

function buildAuthPlugins({ components, context }) {
  const counters = context.typeCounters.auth;
  const authConfig = components.auth;
  buildAdapter({ components, context });
  buildAuthPlugin({
    counter: counters.callbacks,
    pluginConfig: authConfig.callbacks,
    typeClass: 'callback',
    context,
  });
  buildAuthPlugin({
    counter: counters.events,
    pluginConfig: authConfig.events,
    typeClass: 'event',
    context,
  });
  buildAuthPlugin({
    counter: counters.providers,
    pluginConfig: authConfig.providers,
    typeClass: 'provider',
    context,
  });
}

export default buildAuthPlugins;
