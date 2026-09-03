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
import { fileURLToPath } from 'url';

// The published package carries the framework skills in dist/skills/ (copied from the repo's
// skills/ by the build script). When the CLI runs from src/ inside the monorepo, dist/skills
// does not exist beside it, so fall back to the repo root skills/ directory.
const CANDIDATES = ['../../skills', '../../../../../skills'];

function resolveSkillsDirectory() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const candidate of CANDIDATES) {
    const directory = path.resolve(here, candidate);
    if (fs.existsSync(path.join(directory, 'lowdefy-config', 'SKILL.md'))) {
      return directory;
    }
  }
  throw new Error(
    `Lowdefy skills directory not found. Looked in ${CANDIDATES.map((candidate) =>
      path.resolve(here, candidate)
    ).join(', ')}.`
  );
}

export default resolveSkillsDirectory;
