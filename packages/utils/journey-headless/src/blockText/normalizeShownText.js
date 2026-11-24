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

// Text as any layout and any case transform could show it, for a check that must not miss what a
// browser may read: white space taken out (a layout adds or drops breaks and spaces between
// elements), zero-width and soft-hyphen characters taken out, and case folded (a CSS
// text-transform may change it; upper then lower casing folds ß to ss, as uppercase draws it).
function normalizeShownText(text) {
  return String(text)
    .replace(/[\s\u200b\u00ad]/g, '')
    .toUpperCase()
    .toLowerCase();
}

export default normalizeShownText;
