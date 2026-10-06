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

import clusterSegments from './clusterSegments.js';
import countTextTokens from '../journeyEvidence/countTextTokens.js';
import describeSegment from './describeSegment.js';
import mergeOrigin from './mergeOrigin.js';
import parseCandidateOrigin from './parseCandidateOrigin.js';
import prepareSegments from './prepareSegments.js';
import renderCandidate from './renderCandidate.js';
import updateCandidateOrigin from './updateCandidateOrigin.js';

const SOURCES = ['production', 'dev', 'explorer', 'journey'];

function candidateFileName({ hash, pageId }) {
  return `${pageId.replace(/[^A-Za-z0-9_-]/g, '-')}-${hash}.yaml`;
}

function keepSegment({ segment, filters }) {
  if (!type.isNone(filters.build) && !segment.allBuilds.every((build) => build === filters.build)) {
    return false;
  }
  return type.isNone(filters.page) || segment.pages.includes(filters.page);
}

function placeKey({ page, block_id: blockId, column }) {
  return JSON.stringify([page, blockId ?? null, column ?? null]);
}

// The window's token counts for the places the representative clicked with a
// token that resolved to no config text, so the agent can tell a label built
// from values from a data row without the text.
function tokenisedPlaces({ segment, textTokens }) {
  const places = new Set(
    segment.text_clicks
      .filter((click) => !click.config_text && !type.isNone(click.text_token))
      .map(placeKey)
  );
  return textTokens.filter((row) => places.has(placeKey(row)));
}

function buildOrigin({ cluster, source, textTokens }) {
  const { compiled } = cluster.representative;
  const origin = {
    source,
    sequence_hash: cluster.hash,
    sessions: cluster.sessions,
    persons: cluster.persons,
    orgs: cluster.orgs,
    failures: cluster.failures,
  };
  if (!type.isUndefined(compiled.failure)) origin.failure = compiled.failure;
  origin.first_seen = cluster.first_seen;
  origin.last_seen = cluster.last_seen;
  origin.rank = cluster.rank;
  if (source === 'dev') origin.builds = cluster.builds;
  if (compiled.flags.length > 0) origin.flags = compiled.flags;
  const tokenised = tokenisedPlaces({ segment: cluster.representative, textTokens });
  if (tokenised.length > 0) origin.text_tokens = tokenised;
  origin.sample_sessions = cluster.sample_sessions;
  return origin;
}

function publicSegment(segment) {
  const { hash, sequence, steps, persons, orgs, roles, failure, session } = segment;
  return {
    hash,
    sequence,
    steps,
    persons,
    orgs,
    roles,
    failure,
    session,
    first_seen: segment.first_seen,
    last_seen: segment.last_seen,
    // Read by the production profile and coverage.
    page_id: segment.page_id,
    pages: segment.pages,
    failure_path: segment.failure_path,
    frustrations: segment.frustrations,
    text_clicks: segment.text_clicks,
  };
}

// The whole compile: v1 trace records in, one candidate journey per distinct
// flow out, plus every segment's sequence for evidence and coverage. Pure - it
// neither reads nor writes files, so the CLI, a future MCP tool, coverage and
// the tests all drive the same arithmetic.
//
// `existingCandidates` is { fileName: contents } of the output directory. A
// known sequence hash keeps its file and gets a new origin block; a new one
// gets a new file. `filters` ({ since, until, build, page }) is how the CLI's
// flags reach the compile: since/until bound the window, build and page select
// segments. Production records hold config text or a clicked-text token; the
// counts the agent reads a tokenised step by (countTextTokens) are over every
// kept segment of the window.
//
// `prepareCandidate({ journey, origin, comments, sessions })`, when given,
// sees each candidate before it is rendered, with the sessions its cluster
// came from, and returns { journey, origin, comments } to render, or null to
// leave the candidate out. The explorer uses it to keep only candidates that
// touch what a pull request changed, to drop expectations that hold snapshot
// values, and to add its run to the origin. It may drop steps; it never
// writes one.
function compileTrace({
  records,
  blockMetas = {},
  existingCandidates = {},
  source,
  filters = {},
  prepareCandidate,
}) {
  if (!SOURCES.includes(source)) {
    throw new Error(
      `Journey compiler requires "source" to be one of ${SOURCES.join(
        ', '
      )}. Received ${JSON.stringify(source)}.`
    );
  }
  const { segments: prepared, dropped } = prepareSegments({ records, source, filters });
  const segments = prepared
    .map((segment) => describeSegment({ records: segment, blockMetas, source }))
    .filter((segment) => !type.isUndefined(segment) && keepSegment({ segment, filters }));
  const clusters = clusterSegments({ segments });
  const textTokens = countTextTokens({ segments });

  const candidates = clusters
    .map((cluster) => {
      const { compiled } = cluster.representative;
      const fileName = candidateFileName({ hash: cluster.hash, pageId: compiled.journey.pageId });
      const existing = existingCandidates[fileName];
      let candidate = {
        journey: compiled.journey,
        comments: compiled.comments,
        origin: mergeOrigin({
          existing: parseCandidateOrigin({ contents: existing }),
          origin: buildOrigin({ cluster, source, textTokens }),
        }),
      };
      if (!type.isUndefined(prepareCandidate)) {
        candidate = prepareCandidate({
          ...candidate,
          sessions: [...new Set(cluster.segments.map((segment) => segment.session))].sort(),
        });
        if (candidate === null) return null;
      }
      const { journey, comments, origin } = candidate;
      const known = !type.isUndefined(existing);
      return {
        fileName,
        contents: known
          ? updateCandidateOrigin({ contents: existing, origin })
          : renderCandidate({ comments, footer: compiled.footer, journey, origin }),
        hash: cluster.hash,
        journey,
        origin,
        status: known ? 'updated' : 'created',
      };
    })
    .filter((candidate) => candidate !== null);

  return { candidates, segments: segments.map(publicSegment), dropped };
}

export default compileTrace;
