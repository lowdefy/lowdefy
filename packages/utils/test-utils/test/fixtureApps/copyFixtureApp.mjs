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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A copy of a built fixture app a test can change: its config, and a server directory holding
// the build and the built server's own install (linked, not copied). Modified times are kept, so
// the copied build is as fresh against the copied config as the original. Returns the two
// directories and remove(), which deletes the copy.
function copyFixtureApp({ app }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-utils-'));
  const configDirectory = path.join(directory, 'config');
  const serverDirectory = path.join(directory, 'server');
  fs.cpSync(app.configDirectory, configDirectory, {
    recursive: true,
    preserveTimestamps: true,
    filter: (source) =>
      !source.split(path.sep).some((part) => part === '.lowdefy' || part === 'node_modules'),
  });
  fs.mkdirSync(serverDirectory);
  fs.cpSync(path.join(app.serverDirectory, 'build'), path.join(serverDirectory, 'build'), {
    recursive: true,
    preserveTimestamps: true,
  });
  fs.copyFileSync(
    path.join(app.serverDirectory, 'package.json'),
    path.join(serverDirectory, 'package.json')
  );
  fs.symlinkSync(
    path.join(app.serverDirectory, 'node_modules'),
    path.join(serverDirectory, 'node_modules'),
    'dir'
  );
  return {
    configDirectory,
    serverDirectory,
    remove: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
}

export default copyFixtureApp;
