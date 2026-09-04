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

// A collections: field declared required is a promise about every document
// in the collection, including the ones written before the field existed. A
// migration is how existing documents get the field (design D11), so a
// required field that no migration file so much as names is flagged under
// `lowdefy check` — heuristic (the check runs offline and cannot read the
// database) and a warning, never a build error, because the field may be
// legitimately new-collection-only or backfilled outside Lowdefy.
function run({ components, context }) {
  if (components.collections === undefined) return;
  const sources = context.migrationSources ?? [];
  Object.entries(context.collections ?? {}).forEach(([collectionName, collection]) => {
    (collection.required ?? []).forEach((fieldName) => {
      const named = sources.some((source) => source.text.includes(fieldName));
      if (named) return;
      context.handleWarning(
        new ConfigWarning(
          `Collection "${collectionName}" declares field "${fieldName}" as required, but no migration file names it. Existing documents may lack it — add a migration under migrations/ that backfills "${fieldName}", or confirm existing documents already carry it.`,
          { configKey: collection.configKey, checkSlug: 'collections-field-migration' }
        )
      );
    });
  });
}

const fieldWithoutMigration = {
  slug: 'collections-field-migration',
  checkOnly: true,
  run,
};

export default fieldWithoutMigration;
