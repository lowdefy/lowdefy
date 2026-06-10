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

function serveBuildJs(relativePath) {
  const filePath = path.join(process.cwd(), 'build', ...relativePath);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    // Empty default export if the file doesn't exist yet
    return 'export default {};';
  }
}

export default serveBuildJs;
