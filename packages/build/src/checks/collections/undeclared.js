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

// The collections: contract is opt-in, so a connection naming a collection the
// app never declares is a gap in the declaration, not a fault - warn once per
// connection under `lowdefy check`. Silent when the app declares nothing.
function run({ components, context }) {
  if (components.collections === undefined) return;
  (context.connectionCollections ?? []).forEach((binding) => {
    if (binding.collection === undefined) return;
    if (context.collections[binding.collection] !== undefined) return;
    context.handleWarning(
      new ConfigWarning(
        `Connection "${binding.connectionId}" addresses collection "${binding.collection}", which the app does not declare under collections:. Declare it so its tenancy, fields and relations are checked and appear in the data model.`,
        { configKey: binding.configKey, checkSlug: 'collections-undeclared' }
      )
    );
  });
}

const undeclared = {
  slug: 'collections-undeclared',
  checkOnly: true,
  run,
};

export default undeclared;
