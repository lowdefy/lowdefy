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
import { writeFileAtomic, writeFileIfChanged } from '@lowdefy/node-utils';

function createWriteBuildArtifact({ directories }) {
  // Skipping byte-identical writes keeps artifact mtimes stable so Vite does
  // not invalidate modules (clientJsMap → Routing HMR, serverJsMap → SSR
  // reload) on JIT page builds that changed nothing.
  //
  // atomic: true writes a new file whole or not at all, for a file that other
  // processes list and read while it is written (jitMaps/).
  async function writeBuildArtifact(filePath, content, { atomic = false } = {}) {
    const fullPath = path.join(directories.build, filePath);
    if (atomic) {
      await writeFileAtomic(fullPath, content);
      return;
    }
    await writeFileIfChanged(fullPath, content);
  }
  return writeBuildArtifact;
}

export default createWriteBuildArtifact;
