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

// Wrap inline items as a pdfmake text node. A single unstyled item collapses to
// a plain string, so a plain paragraph is { text: 'Hello' } rather than a
// one-element array.
function textContent(items, extra = {}) {
  if (items.length === 1 && Object.keys(items[0]).length === 1) {
    return { text: items[0].text, ...extra };
  }
  return { text: items, ...extra };
}

export default textContent;
