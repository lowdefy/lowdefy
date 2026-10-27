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

// Splits a route path ('/orders?status=open#top') into the location parts the engine reads.
// React Native's URL implementation does not give these parts, so the path is split by hand.
function parsePath(path) {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex === -1 ? '' : path.slice(hashIndex);
  const beforeHash = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const searchIndex = beforeHash.indexOf('?');
  const search = searchIndex === -1 ? '' : beforeHash.slice(searchIndex);
  const pathname = searchIndex === -1 ? beforeHash : beforeHash.slice(0, searchIndex);
  return { hash, pathname, search };
}

export default parsePath;
