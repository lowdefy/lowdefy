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

import crypto from 'node:crypto';

// Strongest first. Like ssri, only the strongest algorithm listed is checked,
// so a weaker hash next to it cannot vouch for the data.
const ALGORITHMS = ['sha512', 'sha384', 'sha256'];

// integrity is a Subresource Integrity string, as npm registries publish it
// in dist.integrity: one or more "<algorithm>-<base64 digest>[?options]"
// entries separated by whitespace.
function verifyIntegrity({ data, integrity, name }) {
  const digests = {};
  (integrity ?? '').split(/\s+/).forEach((entry) => {
    const separator = entry.indexOf('-');
    const algorithm = entry.slice(0, separator);
    if (separator === -1 || !ALGORITHMS.includes(algorithm)) {
      return;
    }
    const [digest] = entry.slice(separator + 1).split('?');
    digests[algorithm] = [...(digests[algorithm] ?? []), digest];
  });
  const algorithm = ALGORITHMS.find((candidate) => digests[candidate]);
  if (!algorithm) {
    throw new Error(`${name} has no sha512, sha384 or sha256 integrity hash in the registry.`);
  }
  const actual = crypto.createHash(algorithm).update(data).digest('base64');
  if (!digests[algorithm].includes(actual)) {
    throw new Error(
      `${name} does not match the ${algorithm} integrity hash in the registry. The download may be corrupted or tampered with.`
    );
  }
}

export default verifyIntegrity;
