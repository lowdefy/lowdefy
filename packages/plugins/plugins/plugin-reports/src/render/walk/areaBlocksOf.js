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

// The child blocks of one engine sub-slot, keyed by area name. The engine keeps
// each area as its own slot, so the grouping the page shows is preserved here
// for the renderer: a Tabs block reads its panels by key, a Card its content
// apart from its title.
function areaBlocksOf(subSlot) {
  const areas = {};
  Object.entries(subSlot?.slots ?? {}).forEach(([areaKey, slot]) => {
    areas[areaKey] = slot?.blocks ?? [];
  });
  return areas;
}

export default areaBlocksOf;
