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

import compileSegment from './compileSegment.js';
import hashSequence from './hashSequence.js';
import journeySequence from './journeySequence.js';
import readFailurePath from './readFailurePath.js';

// The rage and dead clicks of a segment, for the production profile.
function readFrustrations({ records }) {
  return records
    .filter((record) => !type.isNone(record.frustration))
    .map((record) => ({
      page: record.page_id,
      block_id: record.target?.block_id ?? null,
      text: record.target?.text ?? null,
      kind: record.frustration,
    }));
}

function distinctStrings(values) {
  return [...new Set(values.filter(type.isString))].sort();
}

// One folded segment compiled and described: its journey, the sequence and
// hash that identify it, who did it and when. Returns undefined for a segment
// with no interaction steps, which is no journey.
function describeSegment({ records, blockMetas, routeTable, source }) {
  const compiled = compileSegment({ records, blockMetas, source, name: '' });
  const { journey } = compiled;
  const sequence = journeySequence({ pageId: journey.pageId, steps: journey.steps, routeTable });
  if (sequence.length === 0) return undefined;
  const hash = hashSequence({ pageId: journey.pageId, sequence });
  journey.name = `${journey.pageId} recorded ${hash}`;
  const roles = records.find((record) => type.isArray(record.roles))?.roles ?? null;
  return {
    hash,
    sequence,
    steps: journey.steps,
    persons: distinctStrings(records.map((record) => record.person)),
    orgs: distinctStrings(records.map((record) => record.org)),
    roles,
    failure: compiled.failure,
    failure_path: readFailurePath({ records }),
    frustrations: readFrustrations({ records }),
    page_id: journey.pageId,
    session: records[0].session,
    first_seen: records[0].t,
    last_seen: records[records.length - 1].t,
    builds: distinctStrings(records.map((record) => record.build)),
    pages: distinctStrings(records.map((record) => record.page_id)),
    allBuilds: records.map((record) => record.build),
    compiled,
  };
}

export default describeSegment;
