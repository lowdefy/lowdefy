/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function validateVersion({ cliVersion, lowdefyVersion, print, requiresLowdefyYaml }) {
  if (!requiresLowdefyYaml) {
    return;
  }
  if (lowdefyVersion === 'local') {
    return;
  }
  if (!semver.valid(lowdefyVersion)) {
    throw new Error(`
---------------------------------------------------
  Version ${lowdefyVersion} is not a valid version.
---------------------------------------------------`);
  }
  if (semver.major(lowdefyVersion) === 3) {
    throw new Error(`
---------------------------------------------------
  You are attempting to run a version 3 app with the version 4 CLI.
  Please update your app to version 4 using the migration guide.
  View the migration guide here:
    https://docs.lowdefy.com/v3-to-v4
  Alternatively, run the app with the version 3 CLI.
  To do this, run 'npx lowdefy@3'.
---------------------------------------------------`);
  }
  if (isExperimentalVersion(cliVersion) || isExperimentalVersion(lowdefyVersion)) {
    print.warn(`
---------------------------------------------------
  You are using an experimental version of Lowdefy.
  Features may change at any time.
---------------------------------------------------`);
    return;
  }

  const registryUrl = 'https://registry.npmjs.org/lowdefy';
  try {
    const packageInfo = await axios.get(registryUrl);
    const latestVersion = packageInfo.data['dist-tags'].latest;

    if (cliVersion !== latestVersion) {
      print.warn(`
-------------------------------------------------------------
  You are not using the latest version of the Lowdefy CLI.
  Please update to version ${latestVersion}.
  To always use the latest version, run 'pnpx lowdefy@4'.
-------------------------------------------------------------`);
    }
    if (lowdefyVersion && lowdefyVersion !== latestVersion) {
      print.warn(`
-------------------------------------------------------------
  Your app is not using the latest Lowdefy version, ${lowdefyVersion}.
  Please update your app to version ${latestVersion}.
  View the changelog here:
    https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md
-------------------------------------------------------------`);
    }
  } catch (error) {
    print.warn('Failed to check for latest Lowdefy version.');
  }
}

function isExperimentalVersion(version) {
  return version.includes('alpha') || version.includes('beta') || version.includes('rc');
}

export default validateVersion;
