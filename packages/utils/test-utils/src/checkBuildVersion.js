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

import getPackageVersion from './getPackageVersion.js';

// The harness runs the build with the packages the server installed, so it must be the release
// the app was built with: it reads build artifacts and calls @lowdefy/api functions whose shapes
// change between releases. "local" is an app built on a local checkout of Lowdefy, which names
// no release to compare with, as the CLI treats it.
function checkBuildVersion({ appMeta }) {
  const { lowdefyVersion } = appMeta;
  if (lowdefyVersion === 'local') {
    return;
  }
  const packageVersion = getPackageVersion();
  if (lowdefyVersion !== packageVersion) {
    throw new Error(
      `@lowdefy/test-utils is version ${packageVersion}, but the app was built with Lowdefy version ${lowdefyVersion} (the "lowdefy" version in lowdefy.yaml). Install the version the app uses, for example "pnpm add -D @lowdefy/test-utils@${lowdefyVersion}", then run the tests again.`
    );
  }
}

export default checkBuildVersion;
