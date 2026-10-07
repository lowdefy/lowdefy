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

import isOnPath from './isOnPath.js';

// The copy of a mutant one journey's baseline exercised, as { artifact, key,
// anchor }, or undefined when it exercised none. A `_ref`'d layout, menu or
// template node is listed as one mutant kept on its first page, with every
// other page's copy, under that page's own artifact and key, in
// `copyTargets`. The kept copy is tried first.
function findOnPathCopy({ mutant, exercised }) {
  const copies = [
    { artifact: mutant.artifact, key: mutant.key, anchor: mutant.anchor },
    ...mutant.copyTargets,
  ];
  return copies.find(({ anchor }) => isOnPath({ anchor, operator: mutant.operator, exercised }));
}

export default findOnPathCopy;
