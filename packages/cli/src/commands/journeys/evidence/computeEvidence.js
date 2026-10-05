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

import { isBackedBy, journeySequence } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

const SUBKEYS = ['production', 'dev', 'explorer', 'mutation'];

function round2(value) {
  return Math.round(value * 100) / 100;
}

function distinctCount(values) {
  return new Set(values.filter((value) => !type.isNone(value))).size;
}

// A journey's click text enters its sequence only when it is config text, so
// a journey holding a guessed production value is backed exactly as one with
// no text, and no refresh confirms a value that is not in the repository.
function backingSegments({ journey, segments, isConfigText }) {
  const sequence = journeySequence({
    pageId: journey.pageId,
    steps: journey.steps,
    isConfigText,
  });
  return segments.filter((segment) =>
    isBackedBy({
      journeySequence: sequence,
      segmentSequence: segment.sequence,
      pageId: journey.pageId,
    })
  );
}

// Dev segments hold the developer's own text: they are read by the same rule
// as the journeys they back, so non-config text on both sides reads as none.
function readDevSequences({ segments, isConfigText }) {
  if (type.isUndefined(isConfigText)) return segments;
  return segments.map((segment) => ({
    ...segment,
    sequence: journeySequence({ pageId: segment.page_id, steps: segment.steps, isConfigText }),
  }));
}

function productionEvidence({ journey, segments, window, isConfigText }) {
  const backing = backingSegments({ journey, segments, isConfigText });
  const entering = segments.filter((segment) => segment.page_id === journey.pageId);
  const backingEntering = backing.filter((segment) => segment.page_id === journey.pageId);
  return {
    sessions: backing.length,
    persons: distinctCount(backing.flatMap((segment) => segment.persons)),
    orgs: distinctCount(backing.flatMap((segment) => segment.orgs)),
    share: entering.length === 0 ? 0 : round2(backingEntering.length / entering.length),
    failures: backing.filter((segment) => !type.isUndefined(segment.failure)).length,
    window: `${window.from}/${window.to}`,
  };
}

function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// What each committed journey's evidence becomes. A subkey is computed only
// from a source this machine has; one whose source is absent keeps its
// committed value, so a laptop without dev recordings does not erase a
// colleague's counts, and no subkey is invented. `refreshed` moves only when
// some subkey changed, so a no-op refresh changes no file.
//
// - journeys: [{ filePath, journeyIndex, journey }]
// - sources: { production?: { segments, window }, dev?: { segments },
//   mutation?: readMutationReport's result }
//   `dev.recordings` counts the dev segments that back the journey. A
//   mutation report sets `mutation` for the journeys it names only.
// - isConfigText: the app's config text rule; journey click text, and dev
//   segment text, count only when it is config text.
function computeEvidence({ journeys, sources, today, isConfigText }) {
  const devSegments = type.isNone(sources.dev)
    ? null
    : readDevSequences({ segments: sources.dev.segments, isConfigText });
  return journeys.map(({ filePath, file, journeyIndex, journey }) => {
    const before = journey.evidence;
    const computed = {};
    if (!type.isNone(sources.production)) {
      computed.production = productionEvidence({
        journey,
        segments: sources.production.segments,
        window: sources.production.window,
        isConfigText,
      });
    }
    if (!type.isNone(devSegments)) {
      computed.dev = {
        recordings: backingSegments({ journey, segments: devSegments, isConfigText }).length,
      };
    }
    const mutation = sources.mutation?.byJourney.get(`${file}#${journey.name}`);
    if (!type.isUndefined(mutation)) {
      computed.mutation = mutation;
    }
    const after = {};
    SUBKEYS.forEach((key) => {
      const value = key in computed ? computed[key] : before?.[key];
      if (!type.isUndefined(value)) after[key] = value;
    });
    const changed = SUBKEYS.some((key) => !isEqual(before?.[key], after[key]));
    if (changed) {
      after.refreshed = today;
    } else if (!type.isUndefined(before?.refreshed)) {
      after.refreshed = before.refreshed;
    }
    return {
      filePath,
      file,
      journeyIndex,
      name: journey.name,
      pageId: journey.pageId,
      before,
      after,
      changed,
    };
  });
}

export default computeEvidence;
