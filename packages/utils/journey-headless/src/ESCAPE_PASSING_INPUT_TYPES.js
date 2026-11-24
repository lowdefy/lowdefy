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

// Input blocks whose component leaves an Escape pressed in it to the page, so it closes the
// overlay that opened last: antd's plain inputs, and the searching selectors once their dropdown
// is closed (rc-select acts on Escape only while it is open). TextInput and NumberInput fire their
// own onEscape first, so they pass it on only when they have none (pressEscape). Any other input
// (a date picker, an inline edit, a mention input) handles Escape itself, which a headless run does
// not model.
const ESCAPE_PASSING_INPUT_TYPES = new Set([
  'MultipleSelector',
  'NumberInput',
  'PasswordInput',
  'Selector',
  'TextArea',
  'TextInput',
  'TreeMultipleSelector',
  'TreeSelector',
]);

export default ESCAPE_PASSING_INPUT_TYPES;
