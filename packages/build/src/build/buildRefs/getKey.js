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
import { get, ReservedKeyError } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

function getKey({ input, refDef, filePath }) {
  if (refDef.key) {
    try {
      return get(input, refDef.key, { default: null });
    } catch (error) {
      if (!(error instanceof ReservedKeyError)) throw error;
      // The ref key is author-written YAML, so a reserved name is a config mistake. Without
      // this the bare ReservedKeyError reaches the build with no file and no line.
      throw new ConfigError(`_ref key "${refDef.key}" is a reserved name.`, {
        cause: error,
        filePath,
      });
    }
  }
  return input;
}

export default getKey;
