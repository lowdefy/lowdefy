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

import { mergeObjects } from '@lowdefy/helpers';

// The build's types map: the default types with the app's custom types merged
// over them. mergeObjects copies every plain object, so the default packages'
// schemas (about 1 MB) are left out of the merge and added by reference: a
// build does not copy them, and the rebuilds of one dev server hand
// @lowdefy/ajv the same schema objects, so its validators, cached by schema
// object, compile once.
function mergeTypesMaps({ defaultTypesMap, customTypesMap }) {
  const { schemas: defaultSchemas, ...defaultTypes } = defaultTypesMap;
  const typesMap = mergeObjects([defaultTypes, customTypesMap]);
  const customSchemas = typesMap.schemas ?? {};
  typesMap.schemas = { ...customSchemas };
  for (const [kind, schemas] of Object.entries(defaultSchemas)) {
    typesMap.schemas[kind] = { ...schemas, ...customSchemas[kind] };
  }
  return typesMap;
}

export default mergeTypesMaps;
