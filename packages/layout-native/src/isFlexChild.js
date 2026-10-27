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

import { type } from '@lowdefy/helpers';

// A block that sets flex, grow, shrink or size is placed by flex, not by grid columns, and its
// breakpoint layouts are ignored, as on the web (deriveLayout).
function isFlexChild({ flex, grow, shrink, size }) {
  return !type.isNone(flex) || !type.isNone(grow) || !type.isNone(shrink) || !type.isNone(size);
}

export default isFlexChild;
