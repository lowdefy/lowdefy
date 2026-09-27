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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import { parseIpRange } from '@lowdefy/node-utils';

// The server builds its trusted-proxy list from these entries at startup, so an
// entry that is not an address or CIDR range fails the build here instead. A
// range with prefix 0 (0.0.0.0/0, ::/0) trusts every peer, so any client could
// choose its own address through X-Forwarded-For - valid, but almost never
// meant, so it warns.
function validateTrustedProxies({ components, context }) {
  const { trustedProxies } = components.config;
  if (type.isUndefined(trustedProxies)) {
    return;
  }
  const configKey = trustedProxies?.['~k'] ?? components.config['~k'];
  if (!type.isArray(trustedProxies)) {
    throw new ConfigError(
      'App "config.trustedProxies" should be an array of IP address or CIDR range strings.',
      { received: trustedProxies, configKey }
    );
  }
  trustedProxies.forEach((entry) => {
    const range = parseIpRange(entry);
    if (range === null) {
      throw new ConfigError(
        'App "config.trustedProxies" entries should be IP addresses (e.g. "10.0.0.7") or CIDR ranges (e.g. "10.0.0.0/8").',
        { received: entry, configKey }
      );
    }
    if (range.prefix === 0) {
      context.handleWarning(
        new ConfigWarning(
          `App "config.trustedProxies" entry "${entry}" trusts every address, so any client can choose the address auth rate limits and sessions record by sending X-Forwarded-For. List only the addresses or ranges of your proxies.`,
          { configKey }
        )
      );
    }
  });
}

export default validateTrustedProxies;
