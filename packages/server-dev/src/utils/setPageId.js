/*
  Copyright 2020-2021 Lowdefy, Inc

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

function setPageId(lowdefy) {
  if (lowdefy._internal.pathname === '/404') {
    lowdefy.pageId = '404';
    return false;
  }
  if (!lowdefy._internal.query.pageId) {
    lowdefy.pageId = lowdefy.home.pageId;
    if (lowdefy.home.configured === false) {
      return true;
    }
    return false;
  }
  lowdefy.pageId = lowdefy._internal.query.pageId;
  return false;
}

export default setPageId;
