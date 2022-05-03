/*
  Copyright 2020-2022 Lowdefy, Inc

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

import providers from '../../../build/plugins/auth/providers.js';

// TODO: docs:
// Callback url to configure with provider will be: {{ protocol }}{{ host }}/api/auth/callback/{{ providerId }}
// This depends on providerId, which might cause some issues if users copy an example and change the id.
// We need to allow users to configure ids, since they might have more than one of the same type.

function getProviders(authConfig) {
  return authConfig.providers.map((provider) =>
    providers[provider.type]({
      ...provider.properties,
      id: provider.id,
    })
  );
}

export default getProviders;