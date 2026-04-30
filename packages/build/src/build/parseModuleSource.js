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

import { ConfigError } from '@lowdefy/errors';

function parseModuleSource(source) {
  if (source.startsWith('file:')) {
    return { type: 'file', path: source.slice(5) };
  }

  if (source.startsWith('github:')) {
    const rest = source.slice(7);
    const atIndex = rest.lastIndexOf('@');
    if (atIndex === -1) {
      throw new ConfigError(
        `Module source "${source}" is missing @ref (e.g., @v1.0.0).`
      );
    }
    const ref = rest.slice(atIndex + 1);
    const fullPath = rest.slice(0, atIndex);
    const segments = fullPath.split('/');
    if (segments.length < 2) {
      throw new ConfigError(`Module source "${source}" must include owner/repo.`);
    }
    const owner = segments[0];
    const repo = segments[1];
    const path = segments.length > 2 ? segments.slice(2).join('/') : null;
    return { type: 'github', owner, repo, path, ref };
  }

  throw new ConfigError(
    `Unknown module source type: "${source}". Expected "github:" or "file:".`
  );
}

export default parseModuleSource;
