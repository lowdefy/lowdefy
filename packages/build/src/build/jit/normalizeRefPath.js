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

// A file as refs name it, in one form: "api/a.yaml" and "./api/a.yaml" are one
// file. App refs are relative to the config directory with forward slashes,
// as the dev server's watcher names them; module refs are absolute.
function normalizeRefPath(refPath) {
  if (path.isAbsolute(refPath)) {
    return path.normalize(refPath);
  }
  return path.posix.normalize(refPath);
}

export default normalizeRefPath;
