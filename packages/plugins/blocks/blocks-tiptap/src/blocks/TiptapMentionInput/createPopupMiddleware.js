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

import { flip, shift } from '@floating-ui/dom';

// The placement rules of the tippy.js popups these replaced: flip to the other side of the
// reference when less than 5px would be left to the viewport edge, and shift along it to stay 2px
// from the top and bottom and 5px from the sides. Each popup adds tippy's 10px offset before these.
function createPopupMiddleware() {
  return [flip({ padding: 5 }), shift({ padding: { top: 2, bottom: 2, left: 5, right: 5 } })];
}

export default createPopupMiddleware;
