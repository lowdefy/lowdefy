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

// Does this flex child take the row's spare width? `flex` shorthand leads with
// grow (`1 0 auto`, or `true` for `0 1 auto`), and `grow` sets it directly.
function flexGrows(layout) {
  if (type.isNumber(layout.grow)) return layout.grow > 0;
  if (layout.grow === true) return true;
  if (layout.flex === true) return false;
  if (type.isNumber(layout.flex)) return layout.flex > 0;
  if (type.isString(layout.flex)) return Number.parseFloat(layout.flex) > 0;
  return false;
}

export default flexGrows;
