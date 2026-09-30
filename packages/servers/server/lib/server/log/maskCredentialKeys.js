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

import { mapPlainValues } from '@lowdefy/helpers';

// `received` is the one kept log field holding values fetched at runtime (a token
// from an earlier step sent as a header), which the by-value secret scrub
// cannot recognise, so credential-looking keys are masked by name instead.
const credentialKeyParts = ['authorization', 'token', 'secret', 'password', 'apikey', 'cookie'];

function isCredentialKey(key) {
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return credentialKeyParts.some((part) => normalized.includes(part));
}

// Shared references and cycles are copied as such, so the serializer walk still
// marks them '[Circular]'.
function maskCredentialKeys(value) {
  return mapPlainValues(value, (item, key) =>
    key !== undefined && isCredentialKey(key) ? '[REDACTED]' : item
  );
}

export default maskCredentialKeys;
