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

// The build renames menu link ids to `menuitem:<menuId>:<id>`; an app keys badges by the id it
// wrote, or by the page id.
function getPlaceKey(link) {
  return String(link.id ?? link.pageId).replace(/^menuitem:[^:]*:/, '');
}

function getPlaceBadge(badges, link) {
  return badges[getPlaceKey(link)] ?? (link.pageId ? badges[link.pageId] : undefined);
}

export { getPlaceBadge, getPlaceKey };
