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
import { type } from '@lowdefy/helpers';

// Build markers (~k etc.) travel with the mobile config artifact — strip them
// before using it for user-facing files.
function stripMarkers(value) {
  if (type.isArray(value)) return value.map(stripMarkers);
  if (type.isObject(value)) {
    const result = {};
    Object.entries(value).forEach(([key, val]) => {
      if (key.startsWith('~')) return;
      result[key] = stripMarkers(val);
    });
    return result;
  }
  return value;
}

async function readMobileBuildConfig({ context }) {
  const raw = await readFile(path.join(context.directories.build, 'mobile', 'config.json'));
  if (!raw) {
    throw new Error(
      'No mobile build artifacts found. Add a "mobile" section to lowdefy.yaml and run "lowdefy build".'
    );
  }
  return stripMarkers(JSON.parse(raw));
}

export default readMobileBuildConfig;
