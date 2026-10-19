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
import { type } from '@lowdefy/helpers';

// Module refs author their path/resolver/transformer relative to the module
// (e.g. "resolvers/makeActionPages.js"). Rebase those relative paths against the
// module root so they resolve from the module, not the app config dir. Mutates
// refDef in place. No-op when moduleRoot is not set or a path is already absolute.
function rebaseModuleRefPaths({ refDef, moduleRoot }) {
  if (!moduleRoot) return refDef;
  for (const field of ['path', 'resolver', 'transformer']) {
    if (type.isString(refDef[field]) && !path.isAbsolute(refDef[field])) {
      refDef[field] = path.resolve(moduleRoot, refDef[field]);
    }
  }
  return refDef;
}

export default rebaseModuleRefPaths;
