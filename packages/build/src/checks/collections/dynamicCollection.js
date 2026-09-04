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

import { ConfigWarning } from '@lowdefy/errors';

// Connection properties are never evaluated at build, so an operator-valued
// collection name can not be joined to the declaration. Name the connection
// and say what it opts out of, so the gap is visible instead of silent.
function run({ components, context }) {
  if (components.collections === undefined) return;
  (context.connectionCollections ?? []).forEach((binding) => {
    if (!binding.dynamicCollection) return;
    context.handleWarning(
      new ConfigWarning(
        `Connection "${binding.connectionId}" names its collection with an operator, so it can not be joined to the collections: declaration. It opts out of the tenancy agreement check, the tenant $lookup check and the data model until the collection is a literal string.`,
        { configKey: binding.configKey, checkSlug: 'collections-dynamic' }
      )
    );
  });
}

const dynamicCollection = {
  slug: 'collections-dynamic',
  checkOnly: true,
  run,
};

export default dynamicCollection;
