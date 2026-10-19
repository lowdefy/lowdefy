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

import readManagerVersion from './readManagerVersion.mjs';

test('readManagerVersion reads the version from the server package.json, without npm_package_version', () => {
  const saved = process.env.npm_package_version;
  delete process.env.npm_package_version;
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    );
    expect(readManagerVersion()).toBe(packageJson.version);
    expect(packageJson.name).toBe('@lowdefy/server-dev');
  } finally {
    if (saved !== undefined) {
      process.env.npm_package_version = saved;
    }
  }
});
