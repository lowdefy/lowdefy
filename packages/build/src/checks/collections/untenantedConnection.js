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
import { ConfigWarning } from '@lowdefy/errors';

// A connection with no tenant: of its own against a collection declared with a
// tenant field is not a build error - it may deliberately be an admin path -
// but it is worth a look, so it is reported under `lowdefy check`.
function run({ components, context }) {
  if (components.collections === undefined) return;
  (context.connectionCollections ?? []).forEach((binding) => {
    if (binding.collection === undefined || !type.isUndefined(binding.tenant)) return;
    const collection = context.collections[binding.collection];
    if (collection === undefined || !type.isObject(collection.tenant)) return;
    context.handleWarning(
      new ConfigWarning(
        `Connection "${binding.connectionId}" declares no tenant but addresses collection "${binding.collection}", which is declared tenant-scoped on "${collection.tenant.field}". If the connection is meant to be walled on that field declare tenant: ${collection.tenant.field}; if it is a deliberate admin path, leave it and this note stands as the record.`,
        { configKey: binding.configKey, checkSlug: 'collections-untenanted' }
      )
    );
  });
}

const untenantedConnection = {
  slug: 'collections-untenanted',
  checkOnly: true,
  run,
};

export default untenantedConnection;
