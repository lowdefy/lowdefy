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

// Exact inverse of escapeMarkdown: every backslash escapeMarkdown writes precedes an ASCII
// punctuation character (a backslash in the data is itself escaped), so dropping each
// introducing backslash restores the original string.
function unescapeMarkdown(str) {
  return str.replace(/\\([!-/:-@[-`{-~])/g, '$1');
}

export default unescapeMarkdown;
