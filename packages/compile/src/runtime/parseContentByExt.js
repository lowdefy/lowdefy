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

import JSON5 from 'json5';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// parseRefContent parity for the non-YAML matrix: `.json` parses via JSON5,
// every other extension is raw string content. YAML compiles through
// importSource (full lexical marks) and `.njk` is rejected by the compiler
// (D5) — both handled by callers before this dispatch.
function parseContentByExt({ content, path: refPath }) {
  if (!type.isString(refPath) || !type.isString(content)) {
    return content;
  }
  const ext = refPath.slice(refPath.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'json') {
    try {
      return JSON5.parse(content);
    } catch (error) {
      throw new ConfigError(`JSON parse error in "${refPath}".`, {
        cause: error,
        filePath: refPath,
      });
    }
  }
  return content;
}

export default parseContentByExt;
