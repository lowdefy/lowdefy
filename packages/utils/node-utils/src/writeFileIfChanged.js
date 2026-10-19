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

import readFile from './readFile.js';
import writeFile from './writeFile.js';

// Skipping byte-identical writes keeps file mtimes stable so watchers (Vite
// module graph, chokidar) do not react to rebuilds that changed nothing.
async function writeFileIfChanged(filePath, content) {
  const existing = await readFile(filePath);
  if (existing === content) {
    return false;
  }
  await writeFile(filePath, content);
  return true;
}

export default writeFileIfChanged;
