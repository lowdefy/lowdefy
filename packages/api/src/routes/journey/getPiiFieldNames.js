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

// The pii field names the build collected onto every declared collection
// (buildCollections). The check runs on the server, not in the browser: the
// browser would need the app's whole pii vocabulary shipped to every visitor
// to run it, and the sink - not the tab - is what must never hold the field.
async function getPiiFieldNames(context) {
  const collections = await context.readConfigFile('collections.json');
  const names = new Set();
  Object.values(collections ?? {}).forEach((collection) => {
    if (!type.isArray(collection?.pii)) return;
    collection.pii.forEach((name) => names.add(name));
  });
  return names;
}

export default getPiiFieldNames;
