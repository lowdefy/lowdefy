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

// Whether a check's text reads the same in a browser's innerText where white space collapses:
// it is not empty, starts and ends with no white space, and has no break, tab or two spaces in a
// row. Such text is found in a run of html text exactly when it is found once that run's white
// space is collapsed (readHtmlPieces' runShows).
function isPlainText(text) {
  return text !== '' && text === text.trim() && !/[\t\n\r\f]| {2}/.test(text);
}

export default isPlainText;
