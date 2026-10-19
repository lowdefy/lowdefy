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

// The name the journey runner's selector engine is registered under
// (registerShownTextEngine.js).
const SHOWN_TEXT_ENGINE = 'lowdefy-shown-text';

// The selector for a `containing` target. The body is a JSON string, so `>>` or
// quotes in the text never split the selector.
function shownTextSelector(text) {
  return `${SHOWN_TEXT_ENGINE}=${JSON.stringify(text)}`;
}

export { SHOWN_TEXT_ENGINE };
export default shownTextSelector;
