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

// The single source of truth for which module-manifest regions each build
// phase defers, records, or skips — one table instead of hand-maintained
// shouldStop regex sets that must agree.
//
// Phases:
// - 'header'      Phase A: parse static header keys (dependencies, plugins,
//                 secrets, vars definitions — defaults record-ified); content
//                 sections stay raw parsed YAML ('skip' = leave raw, do not
//                 descend).
// - 'exportables' Phase C.5: record-ify per-consumer bodies (components,
//                 menu links) in module-static scope; everything else stays
//                 raw for Phase D.
// - 'manifest'    Phase D: one full walk; only varDefault placeholders need a
//                 rule (single-value kinds would otherwise be forced by the
//                 placeholder dispatch — they are demand-only). Per-consumer
//                 placeholders pass through the dispatch untouched.
//
// entryRef/connRemap creation is value-shape-driven (deferModuleRefs in the
// walker), not path-driven, so it has no row here. The JIT page-content
// predicate lives in buildRefs.js (it composes with the app-pass modules
// preserve and is not a manifest phase).

const VAR_DEFAULT = /^vars(\.[^.]+\.properties)*\.[^.]+\.default(\..*)?$/;
const CONTENT_SECTIONS = /^(pages|api|connections|agents|menus|components)(\..*)?$/;
const NON_EXPORTABLE_SECTIONS = /^(pages|api|connections|agents|vars|dependencies|plugins|secrets)(\..*)?$/;

const DEFERRED_REGIONS = [
  { phase: 'header', match: VAR_DEFAULT, action: 'record:varDefault' },
  { phase: 'header', match: CONTENT_SECTIONS, action: 'skip' },
  { phase: 'exportables', match: /^components\.\d+\.component$/, action: 'record:component' },
  { phase: 'exportables', match: /^menus\.\d+\.links$/, action: 'record:menuLinks' },
  { phase: 'exportables', match: NON_EXPORTABLE_SECTIONS, action: 'skip' },
  { phase: 'manifest', match: VAR_DEFAULT, action: 'record:varDefault' },
];

function makeShouldStop(phase) {
  const rows = DEFERRED_REGIONS.filter((row) => row.phase === phase);
  return (childPath) => {
    for (const row of rows) {
      if (row.match.test(childPath)) return row.action;
    }
    return false;
  };
}

export { DEFERRED_REGIONS, makeShouldStop };
