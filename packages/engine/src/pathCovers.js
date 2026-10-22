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

import { splitPath } from '@lowdefy/helpers';

// True when writing `path` replaces the value at `target`: the paths are equal, or `path` is an
// ancestor of `target` on a segment boundary ('contact' covers 'contact.extra', not 'contactx.extra').
function pathCovers({ path, target }) {
  const pathSegments = splitPath(path);
  const targetSegments = splitPath(target);
  if (pathSegments.length > targetSegments.length) {
    return false;
  }
  return pathSegments.every((segment, i) => segment === targetSegments[i]);
}

export default pathCovers;
