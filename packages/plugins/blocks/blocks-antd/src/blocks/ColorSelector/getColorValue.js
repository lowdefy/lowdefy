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

// A gradient has no hex form, so it is kept as the CSS it renders as, which the block reads back
// with toPickerColor. The clear button hands over a transparent color marked cleared.
function getColorValue(color) {
  if (color.cleared) return null;
  if (color.isGradient()) return color.toCssString();
  return color.toHexString();
}

export default getColorValue;
