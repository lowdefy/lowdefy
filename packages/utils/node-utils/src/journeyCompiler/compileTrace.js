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
import describeSegments from './describeSegments.js';
import publicSegment from './publicSegment.js';
import renderCandidate from './renderCandidate.js';

function candidateFileName({ hash, pageId }) {
  return `${pageId.replace(/[^A-Za-z0-9_-]/g, '-')}-${hash}.yaml`;
}

function buildOrigin({ cluster }) {
  const { compiled } = cluster.representative;
  const origin = {
    source: 'explorer',
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
  if (compiled.flags.length > 0) origin.flags = compiled.flags;
  origin.sample_sessions = cluster.sample_sessions;
  return origin;
}

// The explorer's walks compiled to candidate journeys: one candidate per
// distinct flow, plus every segment's sequence. Journeys are otherwise written
// by the coding agent from session logs (formatSessionLog); only the explorer
// still turns its own walks into candidates. Pure - it neither reads nor
// writes files.
//
// `routeTable` ({ routes, basePath }) is how a segment's sequence reads the
// page a navigation by click landed on. `filters` ({ since, until }) bound the
// window.
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
  routeTable,
  source,
  filters = {},
  prepareCandidate,
}) {
  if (source !== 'explorer') {
    throw new Error(
      `Journey compiler compiles only explorer walks to candidates. Received "source" ${JSON.stringify(
        source
      )}.`
    );
  }
  const { segments, dropped } = describeSegments({
    records,
    blockMetas,
    routeTable,
    source,
    filters,
  });
  const clusters = clusterSegments({ segments });

  const candidates = clusters
    .map((cluster) => {
      const { compiled } = cluster.representative;
      let candidate = {
        journey: compiled.journey,
        comments: compiled.comments,
        origin: buildOrigin({ cluster }),
      };
      if (!type.isUndefined(prepareCandidate)) {
        candidate = prepareCandidate({
          ...candidate,
          sessions: [...new Set(cluster.segments.map((segment) => segment.session))].sort(),
        });
        if (candidate === null) return null;
      }
      const { journey, comments, origin } = candidate;
      return {
        fileName: candidateFileName({ hash: cluster.hash, pageId: compiled.journey.pageId }),
        contents: renderCandidate({ comments, footer: compiled.footer, journey, origin }),
        hash: cluster.hash,
        journey,
        origin,
      };
    })
    .filter((candidate) => candidate !== null);

  return { candidates, segments: segments.map(publicSegment), dropped };
}

export default compileTrace;
