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

import flowLines from './flowLines.js';
import sequenceId, { SEQUENCE_VERSION } from './sequenceId.js';
import sequenceVersion from './sequenceVersion.js';

// A journey's production flows before this refresh counts them: the live flow
// its steps walk now, and the deprecated flows it walked before.
//
// - No monthly evidence yet (none, or the legacy window shape, which cannot
//   be split into months): the live flow starts empty.
// - Stored under an older SEQUENCE_VERSION: the matcher changed, not the
//   journey, so the id is rehashed without deprecating and `recount` asks for
//   every cached month to be counted again under the new matcher.
// - The same id: nothing moves.
// - Another id at this version: the steps changed what is matched. The
//   committed months move, with the old flow, to a new deprecated entry, and
//   the live flow starts empty, unless the steps went back to one of the
//   journey's own deprecated flows, which becomes live again with its months.
function reconcileFlows({ journey, today, routeTable, isConfigText }) {
  const committed = journey.evidence?.production;
  const current = {
    sequence: sequenceId({
      pageId: journey.pageId,
      steps: journey.steps,
      routeTable,
      isConfigText,
    }),
    pageId: journey.pageId,
    flow: flowLines({ pageId: journey.pageId, steps: journey.steps, routeTable, isConfigText }),
  };
  if (!type.isArray(committed?.months)) {
    return { live: { ...current, months: [] }, deprecated: [], recount: false };
  }
  const deprecated = committed.deprecated ?? [];
  if (sequenceVersion({ sequence: committed.sequence }) !== SEQUENCE_VERSION) {
    return { live: { ...current, months: committed.months }, deprecated, recount: true };
  }
  if (committed.sequence === current.sequence) {
    return { live: { ...current, months: committed.months }, deprecated, recount: false };
  }
  const revived = deprecated.find((entry) => entry.sequence === current.sequence);
  const replaced = {
    sequence: committed.sequence,
    pageId: committed.pageId,
    flow: committed.flow,
    replaced: today,
    months: committed.months,
  };
  return {
    live: { ...current, months: revived?.months ?? [] },
    deprecated: [...deprecated.filter((entry) => entry !== revived), replaced],
    recount: false,
  };
}

export default reconcileFlows;
