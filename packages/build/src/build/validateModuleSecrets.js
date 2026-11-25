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

function checkSecretNodes({ value, declaredSecrets, entryId }) {
  if (type.isArray(value)) {
    for (const item of value) {
      checkSecretNodes({ value: item, declaredSecrets, entryId });
    }
    return;
  }
  if (!type.isObject(value)) return;
  // Only a single-non-tilde-key object is operator shape (matches
  // getRuntimeOperatorKey) — { _secret: 'X', extra: 1 } is deliberately not
  // treated as a secret reference.
  const keys = Object.keys(value).filter((k) => !k.startsWith('~'));
  if (keys.length === 1 && !type.isUndefined(value['_secret'])) {
    const secretName = value['_secret'];
    if (type.isString(secretName) && !declaredSecrets.has(secretName)) {
      throw new ConfigError(
        `Module "${entryId}" references secret "${secretName}" ` +
          `but does not declare it in module.lowdefy.yaml secrets. ` +
          `Add it to the module's secrets list or remove the reference.`,
        { configKey: value['~k'] }
      );
    }
  }
  for (const key of Object.keys(value)) {
    checkSecretNodes({ value: value[key], declaredSecrets, entryId });
  }
}

// A module's content may read only the secrets its manifest declares. The
// dev server's endpoint build checks a rebuilt module endpoint here too.
function validateModuleSecrets({ content, manifest, entryId }) {
  const declaredSecrets = new Set((manifest.secrets ?? []).map((s) => s.name));
  checkSecretNodes({ value: content, declaredSecrets, entryId });
}

export default validateModuleSecrets;
