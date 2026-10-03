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

// The page an app path names: `/orders` is the page `orders`. Paths without a
// leading slash are fragments of a URL (a query, part of a path) and name no
// page. Kept local until the client's parsePageId moves into @lowdefy/helpers,
// then this should use it.
function pageIdFromPath({ path }) {
  if (!path.startsWith('/')) return undefined;
  const pathname = new URL(path, 'http://lowdefy.invalid').pathname;
  const pageId = pathname.replace(/^\//, '').replace(/\/$/, '');
  return pageId === '' ? undefined : pageId;
}

export default pageIdFromPath;
