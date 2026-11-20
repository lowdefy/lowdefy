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
import path from 'node:path';

import collectSecretNames from './collectSecretNames.js';

// Every secret a _secret operator names anywhere in the build: connections, endpoint routines,
// page requests, agents and the auth config alike. All JSON artifacts are read, since any of
// them can hold the operator. Plain JSON.parse: only keys and string values matter here, so
// the serializer's markers can stay as they are.
function readBuildSecretNames({ directories }) {
  const names = new Set();
  fs.readdirSync(directories.build, { recursive: true })
    .filter((filePath) => filePath.endsWith('.json'))
    .forEach((filePath) => {
      const content = fs.readFileSync(path.join(directories.build, filePath), 'utf8');
      // A file that never mentions the operator is not parsed.
      if (!content.includes('"_secret"')) return;
      collectSecretNames({ names, value: JSON.parse(content) });
    });
  return [...names].sort();
}

export default readBuildSecretNames;
