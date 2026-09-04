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

// The compiler needs the build to tell an input block from any other block. A
// developer compiling a trace has either run `lowdefy build` or has `lowdefy
// dev` running, so both build directories are looked in; when neither exists
// the compile still runs and says which steps it could not identify.
function resolveBuildDirectory({ context }) {
  return [context.directories.build, path.join(context.directories.dev, 'build')].find(
    (directory) => fs.existsSync(path.join(directory, 'plugins', 'blockMetas.json'))
  );
}

export default resolveBuildDirectory;
