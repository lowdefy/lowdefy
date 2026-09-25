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

import TAG_COLORS from './tagColors.js';

// A preset tag colour name becomes its theme token; any other value is used as
// a CSS colour.
function resolveTagColor(value) {
  if (type.isNone(value)) return TAG_COLORS.default;
  return TAG_COLORS[value] ?? value;
}

export default resolveTagColor;
