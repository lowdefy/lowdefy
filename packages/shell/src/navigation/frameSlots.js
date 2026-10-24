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

// The route groups the frame's screens live in: app/(t0,t1,t2,t3,t4) is one set of routes shared
// by five groups. With a tabs frame each tab is a group, with its own stack; mobile.menus.tabs has
// at most five items. A drawer or stack frame uses the first group only.
const FRAME_SLOTS = ['t0', 't1', 't2', 't3', 't4'];

function getSlotIndex(segment) {
  return FRAME_SLOTS.indexOf(String(segment).replace(/^\(|\)$/g, ''));
}

export { getSlotIndex };
export default FRAME_SLOTS;
