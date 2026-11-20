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

// Build JSON carries serializer markers (~k, ~arr, ~d), so it is read with the server's own
// serializer, as the server reads it.
function readBuildJson({ directories, filePath, serializer }) {
  const content = fs.readFileSync(path.join(directories.build, filePath), 'utf8');
  return serializer.deserializeFromString(content);
}

export default readBuildJson;
