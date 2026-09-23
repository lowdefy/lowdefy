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

// A `stack` at page level is a layout Box, Card or Content wrapper with no width
// of its own: pdfmake lays its children out exactly as it would top-level nodes.
// Hoisting them lets assembleContent group headings and apply pageBreakBefore at
// any depth — almost every page nests its content in one or more wrappers, so
// without this neither ever fired. Row cells are not touched: a stack inside a
// row is a column and keeps its shape. A break asked for on the wrapper moves to
// its first child.
function flattenStacks(nodes) {
  return nodes.flatMap((node) => {
    if (node.kind !== 'stack') return [node];
    const [first, ...rest] = node.children;
    if (first === undefined) return [];
    const head = node.pageBreakBefore === true ? { ...first, pageBreakBefore: true } : first;
    return flattenStacks([head, ...rest]);
  });
}

export default flattenStacks;
