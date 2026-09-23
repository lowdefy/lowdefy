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

// A soft line break (a newline inside a paragraph) is whitespace, exactly as the
// client's HTML renders it; pdfmake would treat the newline as a hard break.
function softWrap(value) {
  return String(value ?? '').replace(/\r?\n/g, ' ');
}

export default softWrap;
