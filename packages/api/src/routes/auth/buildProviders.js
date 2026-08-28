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
import { ConfigError } from '@lowdefy/errors';

// Splits the unified auth.providers array into BetterAuth's two shapes:
// built-in providers become socialProviders entries keyed by the BetterAuth
// provider key; GenericOAuth entries become genericOAuth plugin configs
// keyed by the Lowdefy provider id.
function buildProviders({ authConfig, plugins }) {
  const socialProviders = {};
  const genericOAuthConfigs = [];

  (authConfig.providers ?? []).forEach((provider) => {
    const providerPlugin = plugins.providers[provider.type];
    if (type.isNone(providerPlugin)) {
      throw new ConfigError(
        `Auth provider type "${provider.type}" not found at provider "${provider.id}".`,
        { configKey: provider['~k'] }
      );
    }
    const definition = providerPlugin({ id: provider.id, properties: provider.properties ?? {} });
    if (definition.kind === 'generic') {
      genericOAuthConfigs.push(definition.config);
      return;
    }
    if (!type.isNone(socialProviders[definition.provider])) {
      throw new ConfigError(
        `Auth provider "${definition.provider}" is configured more than once. BetterAuth supports one configuration per built-in provider.`,
        { configKey: provider['~k'] }
      );
    }
    socialProviders[definition.provider] = definition.options;
  });

  return { socialProviders, genericOAuthConfigs };
}

export default buildProviders;
