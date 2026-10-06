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

// The installed dev server's full config builder, which holds @lowdefy/build
// and the app's plugins (the CLI has neither): its entry script and its
// version, which keys every cached build so a Lowdefy upgrade rebuilds.
function resolveConfigBuilder({ context }) {
  const devDirectory = context.directories.dev;
  const script = path.join(devDirectory, 'lib', 'docs', 'explore', 'buildConfigTree.mjs');
  if (!fs.existsSync(script)) {
    if (!fs.existsSync(path.join(devDirectory, 'package.json'))) {
      throw new Error(
        `No dev server is installed in ${devDirectory}. Run lowdefy dev once, then try again.`
      );
    }
    throw new Error(
      `The dev server installed in ${devDirectory} has no explore builder. Stop the running dev server and start it again to update it.`
    );
  }
  const version = JSON.parse(
    fs.readFileSync(path.join(devDirectory, 'package.json'), 'utf8')
  ).version;
  return { script, version };
}

export default resolveConfigBuilder;
