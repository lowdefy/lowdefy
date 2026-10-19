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

// Inserts text into a textarea's value at its selection (replacing it) and returns the new value
// and the caret after the insert. The picker's column chips insert `{{ key }}` this way.
function insertAtCursor({ element, value, text }) {
  const start = element?.selectionStart ?? value.length;
  const end = element?.selectionEnd ?? value.length;
  return {
    value: `${value.slice(0, start)}${text}${value.slice(end)}`,
    caret: start + text.length,
  };
}

export default insertAtCursor;
