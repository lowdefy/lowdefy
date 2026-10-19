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

// The option a pasted text names, by value or by label, ignoring case: copying a tag cell gives
// its label, so pasting it back must find the same option.
function matchOption({ options, text }) {
  const wanted = String(text).trim().toLowerCase();
  return (
    options.find((option) => String(option.value).toLowerCase() === wanted) ??
    options.find((option) => String(option.label).toLowerCase() === wanted) ??
    null
  );
}

export default matchOption;
