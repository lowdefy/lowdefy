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

// An element's text as shown, whitespace collapsed, without avatar initials.
function visibleText(element) {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const parts = [];
  while (walker.nextNode()) {
    if (walker.currentNode.parentElement.closest('[data-avatar]') === null) {
      parts.push(walker.currentNode.data);
    }
  }
  return parts.join('').replace(/\s+/g, ' ').trim();
}

export default visibleText;
