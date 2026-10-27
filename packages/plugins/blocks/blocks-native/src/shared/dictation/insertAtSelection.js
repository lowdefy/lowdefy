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

// Words that start with closing punctuation join the word before them: "gate" + ", then" reads
// "gate, then", not "gate , then".
const STARTS_WITH_PUNCTUATION = /^[.,!?;:…)\]}]/;
const ENDS_WITH_SPACE = /\s$/;

/**
 * Puts dictated words into a text at the selection: replaces the selected text, or inserts at the
 * cursor. A space goes before the words unless the text before them is empty, already ends in
 * whitespace, or the words start with punctuation.
 *
 * @param {Object} params
 * @param {{ start: number, end: number }} [params.selection] The selection, or the cursor when
 *   start equals end. Without one, the words go at the end of the text.
 * @param {string} params.insert The words to put in.
 * @param {string} params.text
 * @returns {{ text: string, cursor: number }} The new text, and the cursor just after the words.
 */
function insertAtSelection({ text, selection, insert }) {
  const start = selection?.start ?? text.length;
  const end = selection?.end ?? start;
  if (insert === '') {
    return { text, cursor: end };
  }
  const before = text.slice(0, start);
  const after = text.slice(end);
  const needsSpace =
    before !== '' && !ENDS_WITH_SPACE.test(before) && !STARTS_WITH_PUNCTUATION.test(insert);
  const words = needsSpace ? ` ${insert}` : insert;
  return { text: `${before}${words}${after}`, cursor: start + words.length };
}

export default insertAtSelection;
