/*
  Copyright 2020-2021 Lowdefy, Inc

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

import axios from 'axios';
import semver from 'semver';

async function validateVersion({ cliVersion, command, lowdefyVersion, print }) {
  if (['init'].includes(command)) {
    return;
  }
  if (!lowdefyVersion) {
    throw new Error(`
---------------------------------------------------
  Please specify a Lowdefy version.
---------------------------------------------------`);
  }
  if (!semver.valid(lowdefyVersion)) {
    throw new Error(`
---------------------------------------------------
  Version ${lowdefyVersion} is not a valid version.
---------------------------------------------------`);
  }
  if (semver.major(lowdefyVersion) > 3) {
    throw new Error(`
---------------------------------------------------
  You are attempting to run a version ${lowdefyVersion}
  app with the version 3 CLI.
  Please update your Lowdefy CLI version, or
  run 'pnpx lowdefy@${semver.major(lowdefyVersion)} ${command}'.
---------------------------------------------------`);
  }

  const registryUrl = 'https://registry.npmjs.org/lowdefy';
  try {
    const packageInfo = await axios.get(registryUrl);
    const latestVersion = packageInfo.data['dist-tags'].latest;

    if (cliVersion !== latestVersion) {
      print.warn(`
-------------------------------------------------------------
  You are using an outdated Lowdefy CLI.
  Please update to version ${latestVersion}.
  To use the latest version, run 'pnpx lowdefy@${semver.major(latestVersion)}'.
-------------------------------------------------------------`);
    }
    if (lowdefyVersion && lowdefyVersion !== latestVersion) {
      print.warn(`
-------------------------------------------------------------
  Your app is using an outdated Lowdefy version, ${lowdefyVersion}.
  Please update your app to version ${latestVersion}.
  View the changelog here:
    https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md
-------------------------------------------------------------`);
    }
  } catch (error) {
    print.warn('Failed to check for latest Lowdefy version.');
  }
}

export default validateVersion;
