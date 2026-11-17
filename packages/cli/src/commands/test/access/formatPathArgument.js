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

// A directory as the developer types it on a command line: relative when it is inside the working
// directory, its full path otherwise, quoted when it holds whitespace.
function formatPathArgument({ directory }) {
  const relative = path.relative(process.cwd(), directory);
  const inside = relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
  const shown = inside ? relative : path.resolve(directory);
  if (/\s/.test(shown)) {
    return `"${shown}"`;
  }
  return shown;
}

export default formatPathArgument;
