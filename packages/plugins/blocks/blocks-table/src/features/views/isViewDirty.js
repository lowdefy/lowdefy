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

import stableStringify from './stableStringify.js';
import viewKeys from './viewKeys.js';

// Search text and collapsed groups are how a user reads a view, not what the view is, so they
// never make a saved view dirty.
const IGNORED = new Set(['search', 'collapsedGroups']);

// Whether the current view differs from a saved view. Both are resolved views; a part missing
// from either is the default view's part, so `sort: []` and no sort compare equal when the
// default has no sort.
function isViewDirty({ current, saved, defaults }) {
  return viewKeys.some((key) => {
    if (IGNORED.has(key)) return false;
    const a = current?.[key] ?? defaults?.[key] ?? null;
    const b = saved?.[key] ?? defaults?.[key] ?? null;
    return stableStringify(a) !== stableStringify(b);
  });
}

export default isViewDirty;
