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

import blocksReadChanges from './blocksReadChanges.js';
import getMediaChanges from './getMediaChanges.js';
import readMediaViewport from './readMediaViewport.js';

// Runs after the page's debounced resize listener fires. It compares the viewport with the reading
// the page last evaluated against and re-evaluates only the blocks that read a value that changed,
// so a resize within a breakpoint leaves blocks that read only _media: size untouched.
function updateMedia({ context }) {
  const { _internal } = context;
  const next = readMediaViewport({ lowdefy: _internal.lowdefy });
  const changes = getMediaChanges({ previous: _internal.media, next });
  _internal.media = next;
  if (changes.length === 0) {
    return;
  }
  // With dependency tracking off no block records its reads, so any change needs a full pass.
  if (!_internal.DependencyTracker.isEnabled()) {
    _internal.update();
    return;
  }
  if (!blocksReadChanges({ context, changes })) {
    return;
  }
  _internal.update({ changes });
}

export default updateMedia;
