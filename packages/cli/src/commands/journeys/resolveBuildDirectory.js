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

// The compiler reads a block's valueType from the build's block metas. A
// developer compiling traces has `lowdefy dev` running or has run `lowdefy
// build`, so the dev build is looked in first, then the production build; when
// neither exists the compile still runs and says what it cannot tell.
function resolveBuildDirectory({ context }) {
  return [path.join(context.directories.dev, 'build'), context.directories.build].find(
    (directory) => fs.existsSync(path.join(directory, 'plugins', 'blockMetas.json'))
  );
}

export default resolveBuildDirectory;
