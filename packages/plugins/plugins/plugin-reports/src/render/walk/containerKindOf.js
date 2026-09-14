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

const CONTAINER_CATEGORIES = new Set(['container', 'input-container']);

// A container holds one set of areas; a list holds one set per item. Anything
// else is a leaf.
function containerKindOf(block) {
  const category = block.meta?.category;
  if (CONTAINER_CATEGORIES.has(category)) return 'container';
  if (category === 'list') return 'list';
  return undefined;
}

export default containerKindOf;
