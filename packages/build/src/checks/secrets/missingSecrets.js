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

import { ConfigWarning } from '@lowdefy/errors';
import { get, type } from '@lowdefy/helpers';

import collectSecretReferences from './collectSecretReferences.js';
import readSecretsFromEnv, {
  FILTERED_SECRET_NAMES,
  SECRET_ENV_PREFIX,
} from './readSecretsFromEnv.js';

// A _secret whose name is not in the environment reads as null at runtime, on
// the server, with no error - the one class of production failure that
// `lowdefy check` could already see and did not. Check-only: the environment a
// build runs in is rarely the environment the app runs in, so a missing secret
// must never fail a build.
function run({ components, context }) {
  const secrets = readSecretsFromEnv();
  const { dynamic, references } = collectSecretReferences({ components });
  const reported = new Set();

  references.forEach(({ name, configKey }) => {
    const site = `${name} ${configKey}`;
    if (reported.has(site)) return;
    reported.add(site);

    if (FILTERED_SECRET_NAMES.includes(name)) {
      context.handleWarning(
        new ConfigWarning(
          `Secret "${name}" is reserved for Lowdefy authentication and _secret never returns it. This reads as null at runtime.`,
          { configKey, checkSlug: 'secrets' }
        )
      );
      return;
    }
    // Read the way the operator reads, so a dotted name resolves (or fails to
    // resolve) here exactly as it will on the server.
    if (!type.isUndefined(get(secrets, name, { default: undefined }))) return;
    context.handleWarning(
      new ConfigWarning(
        `Secret "${name}" is not set. _secret reads it from the environment variable "${SECRET_ENV_PREFIX}${name}", which is not set in this environment or in .env. This reads as null at runtime.`,
        { configKey, checkSlug: 'secrets' }
      )
    );
  });

  // _build.env names, recorded by the ref walker before it inlined them.
  const envReported = new Set();
  (context.envReferences ?? []).forEach(({ name, hasDefault, configKey }) => {
    if (hasDefault) return;
    const site = `${name} ${configKey}`;
    if (envReported.has(site)) return;
    envReported.add(site);
    if (!type.isUndefined(process.env[name])) return;
    context.handleWarning(
      new ConfigWarning(
        `Environment variable "${name}" is not set. _build.env read it at build time and inlined null; set it in the build environment or in .env, or give the operator a default.`,
        { configKey, checkSlug: 'secrets' }
      )
    );
  });

  if (dynamic > 0) {
    context.logger.debug(
      `${dynamic} _secret ${
        dynamic === 1 ? 'reference names' : 'references name'
      } the secret with an operator: dynamic, unchecked.`
    );
  }
}

const missingSecrets = {
  slug: 'secrets',
  checkOnly: true,
  run,
};

export default missingSecrets;
