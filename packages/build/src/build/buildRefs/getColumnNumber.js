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

// Turns a character offset into a 1-based column (offset from the start of its
// line). Companion to getLineNumber; both are recoverable only while the raw
// file content is in hand, i.e. during addLineNumbers.
function getColumnNumber(content, offset) {
  if (offset == null || offset < 0) return null;
  const lastNewline = content.lastIndexOf('\n', offset - 1);
  return offset - lastNewline;
}

export default getColumnNumber;
