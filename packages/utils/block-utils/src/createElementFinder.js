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

// What the HTML says an element is: its tag and its own data-* attributes. Enhancers mark
// elements with data-lf-*, which the HTML never says.
function getElementSignature(element) {
  const attributes = [...element.attributes]
    .filter(({ name }) => name.startsWith('data-') && !name.startsWith('data-lf-'))
    .map(({ name, value }) => [name, value])
    .sort(([a], [b]) => (a < b ? -1 : 1));
  return JSON.stringify([element.tagName, attributes]);
}

function findSameElements({ root, signature, tagName }) {
  return [...root.querySelectorAll(tagName)].filter(
    (candidate) => getElementSignature(candidate) === signature
  );
}

// An element of HTML that is replaced by new HTML, found again in the new HTML: the element
// that says the same (tag and data-* attributes) at the same place among those that do.
function createElementFinder({ element, root }) {
  const signature = getElementSignature(element);
  const { tagName } = element;
  const index = findSameElements({ root, signature, tagName }).indexOf(element);
  return function findElement(newRoot) {
    if (index === -1) return null;
    return findSameElements({ root: newRoot, signature, tagName })[index] ?? null;
  };
}

export default createElementFinder;
