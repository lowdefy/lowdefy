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

import agGridStandIn from './standIns/agGridStandIn.js';
import confirmModalStandIn from './standIns/confirmModalStandIn.js';
import drawerStandIn from './standIns/drawerStandIn.js';
import dropdownButtonStandIn from './standIns/dropdownButtonStandIn.js';
import dropdownMenuStandIn from './standIns/dropdownMenuStandIn.js';
import menuStandIn from './standIns/menuStandIn.js';
import modalStandIn from './standIns/modalStandIn.js';
import tableStandIn from './standIns/tableStandIn.js';

// What a block's component does for the engine in the browser, done headless, by block type: a
// headless page loads no block component. A stand-in fires the component's events in its order and
// event shape, keeps the state it keeps, and refuses what the browser refuses. Each is an object
// of optional parts, each called with { actor, block, state }, state being what the stand-in keeps
// for the block on the shown page (readStandInState):
// - registerMethods(): registers the block methods the component registers (setOpen, open, a
//   grid's setFilterModel or setFilter), for CallMethod. Run when a page shows and after each step settles
//   (registerBlockStandIns).
// - click({ target }): a click with rowKey or control (step.click), once the block shows.
// - answersBlockClick() and clickBlock(): whether the component answers a plain click on the block
//   itself (a dropdown's trigger), and the click when it does. Without them a plain click fires
//   the block's onClick.
// - clickLandsOn(): the block in this one's content a plain click on it lands on (a DropdownMenu's
//   first content control), or null when it lands on the block itself. The data-set rails check
//   that block with this one (runHeadlessStep's railClick), as the browser runner does.
// - clickContent({ claimed }): a plain click on a block inside this one's content, which is its
//   trigger (a DropdownMenu's), after that block's own click (pointerClick). claimed: a block on
//   the way handled the click, so the engine skips this block's events for it (isClickClaimed).
// - open(): an open step on the block.
// - leave({ targetBlock }): another click, open or select is about to act (on targetBlock), and
//   the block's dropdown is open (state.open): close it as a click outside or the mouse leaving
//   does.
// - expect({ kind, target, timeout }): expect.visible or expect.hidden (kind) with a rowKey.
// The step runner answers a step a block's stand-in has no part for in a browser, naming the block
// and its type (runHeadlessStep). The match is by exact type: a block installed under a type
// prefix, or any other block, has no stand-in.
const BLOCK_STAND_INS = {
  AgGridAlpine: agGridStandIn,
  AgGridBalham: agGridStandIn,
  AgGridLowdefy: agGridStandIn,
  AgGridMaterial: agGridStandIn,
  ConfirmModal: confirmModalStandIn,
  Drawer: drawerStandIn,
  DropdownButton: dropdownButtonStandIn,
  DropdownMenu: dropdownMenuStandIn,
  Menu: menuStandIn,
  Modal: modalStandIn,
  Table: tableStandIn,
};

export default BLOCK_STAND_INS;
