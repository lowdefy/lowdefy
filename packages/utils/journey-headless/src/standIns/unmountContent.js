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

import collectBlockParents from '../collectBlockParents.js';
import isInsideBlock from './isInsideBlock.js';

// Whether a ConfirmModal sits between `block` and `container`: antd draws a confirm dialog in the
// App's holder, outside the block, so the dialog and its content outlive the block's unmount.
function isInConfirmDialog({ block, container, parents }) {
  let current = parents.get(block.id);
  while (current && current.id !== container.id) {
    if (current.type === 'ConfirmModal') {
      return true;
    }
    current = parents.get(current.id);
  }
  return false;
}

// A block's content unmounts, as React drops it when the component stops drawing it (a popup
// closes with destroyOnHidden, a block hides or shows its skeleton): its blocks mount again,
// firing onMount, the next time it draws them, and what their components keep in React
// starts again (a dropdown's open state and selection, a nested Modal's or Drawer's open state).
// The engine keeps their state and values, as the browser's does. A nested ConfirmModal keeps its
// dialogs, which antd draws outside the block.
function unmountContent({ actor, block }) {
  const { mounted, mountFinished, openBlocks, standIns } = actor.page;
  const { blocks, parents } = collectBlockParents({ context: actor.page.context });
  blocks
    .filter((content) => isInsideBlock({ block: content, container: block, parents }))
    .filter((content) => !isInConfirmDialog({ block: content, container: block, parents }))
    .forEach((content) => {
      mounted.delete(content.id);
      mountFinished.delete(content.id);
      if (content.type === 'ConfirmModal') {
        return;
      }
      standIns.delete(content.id);
      openBlocks.delete(content.id);
    });
}

export default unmountContent;
