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

// Elements whose text a browser runner's text match never reads (Playwright's
// shouldSkipForTextMatching).
const UNREAD_ELEMENTS = new Set(['NOSCRIPT', 'SCRIPT', 'STYLE']);
// A button input shows its value, which Playwright reads as its text.
const VALUE_INPUT_TYPES = new Set(['button', 'reset', 'submit']);

// The text Playwright matches a node by (its elementText's full text): the text nodes under it
// joined with nothing between them, a script, style or noscript read as nothing, and a button
// input read as its value. An element `skip` returns true for reads as nothing too.
function readNodeText(node, skip = () => false) {
  if (node.nodeType === node.TEXT_NODE) {
    return node.nodeValue;
  }
  if (node.nodeType !== node.ELEMENT_NODE || UNREAD_ELEMENTS.has(node.tagName) || skip(node)) {
    return '';
  }
  if (node.tagName === 'INPUT' && VALUE_INPUT_TYPES.has(node.type)) {
    return node.value;
  }
  return [...node.childNodes].map((child) => readNodeText(child, skip)).join('');
}

export default readNodeText;
