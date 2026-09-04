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

import clusterSessions from './clusterSessions.js';
import compileSession from './compileSession.js';
import mergeOrigin from './mergeOrigin.js';
import normaliseTrace from './normaliseTrace.js';
import parseCandidateOrigin from './parseCandidateOrigin.js';
import renderCandidate from './renderCandidate.js';
import traceTriples from './traceTriples.js';
import updateCandidateOrigin from './updateCandidateOrigin.js';

function candidateFileName({ hash, pageId }) {
  return `${pageId.replace(/[^A-Za-z0-9_-]/g, '-')}-${hash}.yaml`;
}

function buildOrigin({ failure, group }) {
  return {
    sequence_hash: group.hash,
    sessions: group.sessionCount,
    failures: group.failures,
    first_seen: group.first_seen,
    last_seen: group.last_seen,
    rank: group.rank,
    sample_rids: group.sample_rids,
    ...(type.isUndefined(failure) ? {} : { failure }),
  };
}

// The whole compile: a trace in, one candidate per distinct journey out, plus
// the triples the trace saw for the coverage report. Pure - it neither reads
// nor writes files, so the CLI, the dev MCP and the tests all drive the same
// arithmetic.
//
// `existingCandidates` is { fileName: contents } for the output directory. A
// known sequence hash keeps its file and gets a new origin block; a new one
// gets a new file. That is D11.
function compileTrace({ blockMetas = {}, blockTypes = {}, existingCandidates = {}, trace }) {
  const { dropped, sessions } = normaliseTrace({ trace });
  const groups = clusterSessions({ sessions });

  const candidates = groups.map((group) => {
    const { comments, failure, footer, journey } = compileSession({
      blockMetas,
      blockTypes,
      name: `${group.page_id} recorded ${group.hash}`,
      session: group.representative,
    });
    const fileName = candidateFileName({ hash: group.hash, pageId: group.page_id });
    const existing = existingCandidates[fileName];
    const origin = mergeOrigin({
      existing: parseCandidateOrigin({ contents: existing }),
      origin: buildOrigin({ failure, group }),
    });
    const known = !type.isUndefined(existing);
    return {
      contents: known
        ? updateCandidateOrigin({ contents: existing, origin })
        : renderCandidate({ comments, footer, journey, origin }),
      fileName,
      hash: group.hash,
      journey,
      origin,
      status: known ? 'updated' : 'created',
    };
  });

  return { candidates, dropped, sessions: sessions.length, triples: traceTriples({ sessions }) };
}

export default compileTrace;
