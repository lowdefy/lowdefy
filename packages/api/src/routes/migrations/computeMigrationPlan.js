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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// Pure planning: given the ordered build index and the applied ledger entries,
// decide which migrations are pending and in what order (design D3, D5, D8).
// The index is the source of order (lexical on the id, set at build); the
// ledger is the source of what has run. This is the one function both the CLI
// runner and the serving preflight call, so pending is computed identically in
// both.
//
//   index    [{ id, checksum }] — build/migrations.json `migrations`, in order
//   applied  [{ id, checksum }] — the stage ledger's `applied` entries
//   options  { to, allowChecksumMismatch }
//
// Returns { pending, applied, mismatches, missingFiles } and never writes.
// A checksum mismatch (an applied migration whose file changed) is reported,
// not thrown here — the caller decides (the CLI throws unless
// --allow-checksum-mismatch; the preflight ignores it and only counts pending).
function computeMigrationPlan({ index, applied, options = {} }) {
  const orderedIndex = type.isArray(index) ? index : [];
  const appliedById = new Map();
  (type.isArray(applied) ? applied : []).forEach((entry) => {
    if (!type.isNone(entry?.id)) {
      appliedById.set(entry.id, entry);
    }
  });

  if (!type.isNone(options.to)) {
    const known = orderedIndex.some((entry) => entry.id === options.to);
    if (!known) {
      throw new ConfigError(
        `Migration "--to ${options.to}" is not a known migration. Built migrations: ${
          orderedIndex.length === 0 ? '(none)' : orderedIndex.map((entry) => entry.id).join(', ')
        }.`
      );
    }
  }

  const pending = [];
  const mismatches = [];
  for (const entry of orderedIndex) {
    const appliedEntry = appliedById.get(entry.id);
    if (type.isNone(appliedEntry)) {
      // A pending migration past the --to bound is not planned this run, but a
      // pending migration BEFORE an applied one is still pending — order is by
      // the index, so it simply runs first.
      if (!type.isNone(options.to) && entry.id > options.to) {
        continue;
      }
      pending.push({ id: entry.id, checksum: entry.checksum });
      continue;
    }
    if (appliedEntry.checksum !== entry.checksum) {
      mismatches.push({
        id: entry.id,
        appliedChecksum: appliedEntry.checksum,
        builtChecksum: entry.checksum,
      });
    }
  }

  // An applied ledger id with no file in the current build — deleted or renamed
  // (design D3). Reported as a warning by the caller, never fatal.
  const indexIds = new Set(orderedIndex.map((entry) => entry.id));
  const missingFiles = [...appliedById.keys()].filter((id) => !indexIds.has(id));

  return {
    pending,
    applied: [...appliedById.keys()],
    mismatches,
    missingFiles,
  };
}

export default computeMigrationPlan;
