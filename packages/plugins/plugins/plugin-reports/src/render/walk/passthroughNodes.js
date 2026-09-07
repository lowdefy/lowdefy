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

// A container or list with no renderer passes its children through so a plain
// Card never swallows its contents. Areas follow their config key order, and a
// list's items follow the list.
function passthroughNodes({ areas, items }) {
  if (items !== undefined) {
    return items.flatMap((itemAreas) => Object.values(itemAreas).flat());
  }
  if (areas !== undefined) {
    return Object.values(areas).flat();
  }
  return [];
}

export default passthroughNodes;
