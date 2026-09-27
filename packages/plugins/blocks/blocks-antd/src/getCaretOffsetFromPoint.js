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

function getCaretPosition({ x, y }) {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    return position && { node: position.offsetNode, offset: position.offset };
  }
  // Safari only implements the older WebKit API.
  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    return range && { node: range.startContainer, offset: range.startOffset };
  }
  return null;
}

// Character offset of the click within the element's text, so editing starts with the caret where
// the user clicked instead of at the end.
function getCaretOffsetFromPoint({ element, x, y }) {
  const position = getCaretPosition({ x, y });
  if (!position || !element.contains(position.node)) {
    return null;
  }
  const range = document.createRange();
  range.setStart(element, 0);
  range.setEnd(position.node, position.offset);
  return range.toString().length;
}

export default getCaretOffsetFromPoint;
