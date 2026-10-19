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

// Client-space left/right edges of a layout column, from the layout's own geometry rather than
// the DOM, so columns outside the rendered virtual range still work as drop targets.
function getColumnClientBounds({ col, layout, scroller }) {
  const rect = scroller.getBoundingClientRect();
  let left;
  if (col.region === 'start') {
    left = rect.left + col.left;
  } else if (col.region === 'end') {
    left = rect.left + scroller.clientWidth - col.right - col.width;
  } else {
    left = rect.left + layout.startWidth + col.centerStart - scroller.scrollLeft;
  }
  return { left, right: left + col.width };
}

export default getColumnClientBounds;
