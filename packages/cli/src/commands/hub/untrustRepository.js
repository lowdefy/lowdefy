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

import getHubPaths from './getHubPaths.js';
import readTrustedRepositories from './readTrustedRepositories.js';
import withStartLock from './withStartLock.js';
import writeTrustedRepositories from './writeTrustedRepositories.js';

// Removes every listed entry that is trusted, under the same lock as
// trustRepository, and returns the ones it removed.
async function untrustRepository({ repositories }) {
  const { hubDirectory, trustedLockPath } = getHubPaths();
  fs.mkdirSync(hubDirectory, { recursive: true, mode: 0o700 });
  return withStartLock({ lockPath: trustedLockPath }, () => {
    const trusted = readTrustedRepositories();
    const removed = trusted.filter((entry) => repositories.includes(entry));
    if (removed.length > 0) {
      writeTrustedRepositories({
        repositories: trusted.filter((entry) => !removed.includes(entry)),
      });
    }
    return removed;
  });
}

export default untrustRepository;
