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

// The frame an app's mobile menus declare: { kind: 'tabs', items }, { kind: 'drawer', items } or
// { kind: 'stack' }. The server drops the items a caller may not open, so a tabs frame left with
// fewer than two items, or a drawer with none, falls back to a stack.
function getFrame(menus) {
  if ((menus?.tabs?.length ?? 0) >= 2) {
    return { kind: 'tabs', items: menus.tabs };
  }
  if ((menus?.drawer?.length ?? 0) >= 1) {
    return { kind: 'drawer', items: menus.drawer };
  }
  return { kind: 'stack', items: [] };
}

export default getFrame;
