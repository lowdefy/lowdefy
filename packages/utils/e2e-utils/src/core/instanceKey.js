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

// Browser-side expression: the context of the page instance on screen. The URL path, without the
// basePath and one leading and one trailing slash (the form the client's path memory is keyed
// by), is mapped to its instance through window.lowdefy.pathMemory, so two instances of one
// patterned page are told apart. As the engine's lookupPath reads it, a path the memory has not
// seen is the id of a page without a pattern; the app root shows the home page.
const pageContextExpression = `(() => {
  const lowdefy = window.lowdefy;
  if (!lowdefy) return undefined;
  const basePath = lowdefy.basePath ?? '';
  let path = window.location.pathname;
  if (basePath && path.startsWith(basePath)) path = path.slice(basePath.length);
  path = path.replace(/^\\//, '').replace(/\\/$/, '');
  const entry = lowdefy.pathMemory.get(path);
  if (entry) return lowdefy.contexts[entry.instanceKey];
  const pageId = path === '' ? lowdefy.home?.pageId : path;
  return lowdefy.contexts['page:' + pageId];
})()`;

export default pageContextExpression;
