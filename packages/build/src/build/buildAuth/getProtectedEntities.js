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

import { type } from '@lowdefy/helpers';
import { isInPatternList } from './matchPattern.js';

// Resolves the protected item ids for one auth entity (pages, api or
// websockets) from its public/protected declaration. validateMutualExclusivity
// has already rejected configs that set both.
function getProtectedEntities({ components, entity }) {
  const entityConfig = components.auth[entity];
  const itemIds = (components[entity] ?? []).map((item) => item.id);
  let protectedIds = [];

  if (type.isArray(entityConfig.public)) {
    protectedIds = itemIds.filter((itemId) => !isInPatternList(itemId, entityConfig.public));
  } else if (entityConfig.protected === true) {
    protectedIds = itemIds;
  } else if (type.isArray(entityConfig.protected)) {
    protectedIds = itemIds.filter((itemId) => isInPatternList(itemId, entityConfig.protected));
  }
  return protectedIds;
}

// The protection an item id absent from the build inherits - the app's declared
// default, resolved at build so the runtime never re-derives it from patterns
// (Decision 7). Coarser than the config on purpose: the three modes are
// picomatch glob lists, so an absent id can still match a declared pattern -
// accepted, because the alternative is shipping the lists and matching globs on
// the request path to change the answer for URLs that are wrong anyway.
function getEntityDefaultProtected({ components, entity }) {
  const entityConfig = components.auth[entity] ?? {};
  if (type.isArray(entityConfig.public)) return true;
  if (entityConfig.protected === true) return true;
  return false;
}

export default getProtectedEntities;
export { getEntityDefaultProtected };
