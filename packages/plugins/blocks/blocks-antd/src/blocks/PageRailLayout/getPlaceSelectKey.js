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

import getPlaceKey from './getPlaceKey.js';

// The key a place is selected and reported by: its page id, else the id the app wrote, without the
// prefix the build adds.
function getPlaceSelectKey(link) {
  return link.pageId ?? getPlaceKey(link);
}

export default getPlaceSelectKey;
