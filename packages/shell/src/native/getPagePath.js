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

/**
 * The path of a page in the app's root page index, or null when the caller cannot open it.
 *
 * @param {Object} params
 * @param {Object} params.root The mobile root.
 * @param {string} params.pageId
 */
function getPagePath({ pageId, root }) {
  const entry = (root?.pageIndex ?? []).find((item) => item.pageId === pageId);
  if (entry === undefined) {
    return null;
  }
  return entry.path.startsWith('/') ? entry.path : `/${entry.path}`;
}

export default getPagePath;
