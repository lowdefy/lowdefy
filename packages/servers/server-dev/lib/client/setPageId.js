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

// location comes from the custom router (@lowdefy/client/adapters):
// { pageId, pathname, search }. pageId is null at the root path.
function setPageId(location, rootConfig) {
  if (location.pageId === '404') {
    return { redirect: false, pageId: '404' };
  }
  if (!location.pageId) {
    if (rootConfig.home.configured === false) {
      return { redirect: true, pageId: rootConfig.home.pageId };
    }
    return { redirect: false, pageId: rootConfig.home.pageId };
  }
  return { redirect: false, pageId: location.pageId };
}

export default setPageId;
