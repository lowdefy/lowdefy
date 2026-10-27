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

// The combining marks NFD splits from their letters, so "é" matches "e".
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Text as a picker search compares it: decomposed with its accents dropped, in lower case and
 * trimmed, so a search ignores case and diacritics.
 *
 * @param {Object} params
 * @param {string} params.text
 * @returns {string}
 */
function normalizeSearchText({ text }) {
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim();
}

export default normalizeSearchText;
