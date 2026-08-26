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

import path from 'path';
import { readFile } from '@lowdefy/node-utils';

// The artifact is written marker-free by the build (skipMarkers) — plain JSON.
// buildDirectory overrides the default for the dev server's build output.
async function readMobileBuildConfig({ context, buildDirectory }) {
  const directory = buildDirectory ?? context.directories.build;
  const raw = await readFile(path.join(directory, 'mobile', 'config.json'));
  if (!raw) {
    throw new Error(
      'No mobile build artifacts found. Add a "mobile" section to lowdefy.yaml and run "lowdefy build".'
    );
  }
  return JSON.parse(raw);
}

export default readMobileBuildConfig;
