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

// A `lowdefy` command for the run's app, as the developer types it: with --config-directory when
// the app is not the working directory, relative when the app is inside it.
function formatAccessCommand({ configDirectory, args }) {
  const relative = path.relative(process.cwd(), configDirectory);
  if (relative === '') {
    return `lowdefy ${args}`;
  }
  const inside = !relative.startsWith('..') && !path.isAbsolute(relative);
  const directory = inside ? relative : path.resolve(configDirectory);
  const quoted = /\s/.test(directory) ? `"${directory}"` : directory;
  return `lowdefy ${args} --config-directory ${quoted}`;
}

export default formatAccessCommand;
