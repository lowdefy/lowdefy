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

// Replaces an element's content with one text node and returns it. Enhancers
// that write text later update only that node, so anything appended to the
// element afterwards (a copy button) survives the update.
function replaceText(element, text) {
  const node = element.ownerDocument.createTextNode(text);
  element.replaceChildren(node);
  return node;
}

export default replaceText;
