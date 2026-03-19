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

function createWorkspace({ targetDir }) {
  fs.writeFileSync(path.join(targetDir, 'pnpm-workspace.yaml'), 'packages: []\n');
  if (!fs.existsSync(path.join(targetDir, '.npmrc'))) {
    fs.writeFileSync(path.join(targetDir, '.npmrc'), 'strict-peer-dependencies=false\n');
  }
}

export default createWorkspace;
