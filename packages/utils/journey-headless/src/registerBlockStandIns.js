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

import collectBlockParents from './collectBlockParents.js';
import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';

const LIST_METHODS = ['moveItemDown', 'moveItemUp', 'pushItem', 'removeItem', 'unshiftItem'];

// Registers the block methods a block's component registers in the browser, which CallMethod
// calls, so a headless page answers them: a Modal's or Drawer's setOpen({ open }) and toggleOpen()
// set its open state through setOpen, and a list block's item methods are its own engine methods,
// as the List component registers them. A method no stand-in registers fails CallMethod, which
// names the block and the method. Run again after the page changes, since list rows add blocks.
function registerBlockStandIns({ context, openBlocks, setOpen }) {
  const { blockMetas } = context._internal.lowdefy._internal;
  collectBlockParents({ context }).blocks.forEach((block) => {
    if (POPUP_BLOCK_TYPES.has(block.type)) {
      block.registerMethod('setOpen', ({ open } = {}) => setOpen({ block, open: Boolean(open) }));
      block.registerMethod('toggleOpen', () => setOpen({ block, open: !openBlocks.has(block.id) }));
      return;
    }
    if (blockMetas[block.type]?.category === 'list') {
      LIST_METHODS.forEach((method) => block.registerMethod(method, block[method]));
    }
  });
}

export default registerBlockStandIns;
