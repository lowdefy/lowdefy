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

import fs from 'fs';
import path from 'path';

import findRepository from './findRepository.js';
import untrustRepository from './untrustRepository.js';

// The path of a directory that no longer exists, with its nearest existing
// ancestor resolved as the trust list stores it (/tmp is /private/tmp on
// macOS).
function resolveMissingPath({ directory }) {
  const resolved = path.resolve(directory);
  let existing = resolved;
  while (!fs.existsSync(existing) && path.dirname(existing) !== existing) {
    existing = path.dirname(existing);
  }
  return path.join(fs.realpathSync.native(existing), path.relative(existing, resolved));
}

async function hubUntrust({ directory = '.' }) {
  // A deleted repository cannot be keyed: remove the entry it named, its
  // path or its .git directory.
  const candidates = fs.existsSync(path.resolve(directory))
    ? [findRepository({ directory })]
    : [resolveMissingPath({ directory }), path.join(resolveMissingPath({ directory }), '.git')];
  const removed = await untrustRepository({ repositories: candidates });
  if (removed.length === 0) {
    process.stdout.write(`${candidates.join(' or ')} was not trusted.\n`);
    return;
  }
  process.stdout.write(
    `No longer trusted: ${removed.join(
      ', '
    )}. Agent sessions started elsewhere ask again before using it.\n`
  );
}

export default hubUntrust;
