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

// The ids of the blocks a person could see right now. A block counts when its
// wrapper (`#bl-<blockId>`) is shown and the block's own markup inside it has
// a size. A Modal or Drawer renders nothing there but an empty anchor: its
// content sits in a portal, in its slot wrappers (`#ar-<blockId>-<slot>`),
// which antd hides with display: none once closed, so it counts while one of
// those is shown. Run in the page, by the journey observer on every DOM change
// and by the runner's page.evaluate at each settle, so it reads nothing from
// its closure.
function collectVisibleBlockIds() {
  function isShown(element) {
    return element.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  }
  function hasSize(element) {
    const { width, height } = element.getBoundingClientRect();
    return width > 0 && height > 0;
  }
  const ids = new Set();
  document.querySelectorAll('[id^="bl-"]').forEach((wrapper) => {
    if (isShown(wrapper) && [...wrapper.children].some(hasSize)) {
      ids.add(wrapper.id.slice(3));
    }
  });
  document.querySelectorAll('[id^="ar-"]').forEach((area) => {
    if (isShown(area) && hasSize(area)) {
      ids.add(area.id.slice(3, area.id.lastIndexOf('-')));
    }
  });
  return [...ids];
}

export default collectVisibleBlockIds;
