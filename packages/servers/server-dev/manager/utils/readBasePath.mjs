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

// The build always writes config.json, and Vite reads basePath from the same
// file when the child starts, so the manager and the child agree on it.
function readBasePath({ directories }) {
  const config = JSON.parse(fs.readFileSync(path.join(directories.build, 'config.json'), 'utf8'));
  return config.basePath ?? '';
}

export default readBasePath;
