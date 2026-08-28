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

import { snakeCase } from 'change-case';

import type from './type.js';

// Shallow snake_cases every own top-level key of the resolved caller - the
// object mirror of the adapter's schema-wide fieldName derive. Values are
// copied by reference: the attributes and profile bags (and the roles array)
// ride through whole, so their inner keys - app/module-owned, not platform
// surface - are never transformed.
function normalizeCaller(user) {
  if (type.isNone(user)) return user;
  const normalized = {};
  for (const [key, value] of Object.entries(user)) {
    normalized[snakeCase(key)] = value;
  }
  return normalized;
}

export default normalizeCaller;
