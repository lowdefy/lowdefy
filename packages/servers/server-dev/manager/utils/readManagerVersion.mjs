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

// The manager's own package.json - in an app, the CLI's copy in .lowdefy/dev,
// which carries the installed server-dev version. Read from the file, not
// npm_package_version, which only a package manager's `run` sets: the CLI
// starts the manager with node directly.
function readManagerVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  );
  return packageJson.version;
}

export default readManagerVersion;
