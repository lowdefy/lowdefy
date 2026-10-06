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

import describeLogRecord from './describeLogRecord.js';
import foldInteractions from '../journeyCompiler/foldInteractions.js';
import normaliseRecords from '../journeyCompiler/normaliseRecords.js';
import segmentSession from '../journeyCompiler/segmentSession.js';

// One session's trace records as a log a coding agent reads to write
// journeys: one line per interaction with what the app did in response, e.g.
// `click save → Validate failed [priority]`, and a `page <pageId>` line per
// page view. Records are validated, folded and translated exactly as the
// journey compiler does, so a line names the same target a journey step
// would. A failed attempt and its retry are both kept, values typed in dev are
// shown as typed, and nothing is turned into an assertion: deciding what a
// journey proves is the reader's job.
//
// `blockMetas` (the build's plugins/blockMetas.json) is how an input no
// journey verb drives (a date picker) is told apart from one `fill` can type
// into. Returns { id, start, end, lines }.
function formatSessionLog({ records, blockMetas = {} }) {
  const { sessions } = normaliseRecords({ records });
  if (sessions.length !== 1) {
    throw new Error(
      `formatSessionLog requires the valid records of exactly one session. Received ${
        sessions.length
      } sessions: ${JSON.stringify(sessions.map((session) => session.session))}.`
    );
  }
  const [{ session, records: sorted }] = sessions;
  const lines = [];
  let build;
  segmentSession({ records: sorted }).forEach((segment) => {
    foldInteractions({ records: segment }).forEach((record) => {
      if (!type.isNone(record.build)) {
        // A config edit reloads the page on a new build; what came after it
        // ran against different config.
        if (!type.isUndefined(build) && record.build !== build) lines.push('(config rebuilt)');
        build = record.build;
      }
      const line = describeLogRecord({ record, blockMetas });
      if (!type.isUndefined(line)) lines.push(line);
    });
  });
  return {
    id: session,
    start: sorted[0].t,
    end: sorted[sorted.length - 1].t,
    lines,
  };
}

export default formatSessionLog;
