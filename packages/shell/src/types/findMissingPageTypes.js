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

import checkTypeSet from './checkTypeSet.js';
import collectPageTypes from './collectPageTypes.js';

// The types a page needs that this shell lacks. A production root lists the page's type set under
// its typesKey; a dev root lists none, so the page's own config is read when it has arrived.
function findMissingPageTypes({ entry, manifest, page, root }) {
  if (entry.typesKey !== undefined) {
    return checkTypeSet({ manifest, typeSet: root.typeSets[entry.typesKey] ?? {} });
  }
  if (page === undefined) {
    return [];
  }
  const used = collectPageTypes(page.pageConfig);
  return [
    ...used.blocks
      .filter((name) => manifest.blocks[name] === undefined)
      .map((name) => ({ category: 'blocks', type: name })),
    ...used.actions
      .filter((name) => manifest.actions[name] === undefined)
      .map((name) => ({ category: 'actions', type: name })),
  ];
}

export default findMissingPageTypes;
