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

// The app name is also the local MongoDB database name in .env, so it is
// reduced to the characters a database name and a YAML scalar both take
// without quoting. A directory named "." or "~" leaves nothing behind, hence
// the fallback.
function resolveAppName({ directory }) {
  const name = path
    .basename(path.resolve(directory))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (name === '') {
    return 'lowdefy-app';
  }
  return name;
}

export default resolveAppName;
