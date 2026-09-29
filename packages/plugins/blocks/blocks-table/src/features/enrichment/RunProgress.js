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

import React from 'react';

import formatRunCounts from './formatRunCounts.js';

// Header part of enrichment and ai columns: "12 running · 3 errors" while any of the column's
// cells are queued, running or failed, counted over the loaded rows (or read from the server's
// aggregates in server mode; useEnrichment).
function RunProgress({ api, col }) {
  const counts = api.enrichment?.counts.get(col.key);
  if (!counts) return null;
  const text = formatRunCounts(counts);
  if (text === '') return null;
  return (
    <span
      className="lf-enrich-progress"
      data-errors={counts.error > 0 ? '' : undefined}
      data-lf-enrich-progress=""
      data-running={counts.running > 0 || counts.queued > 0 ? '' : undefined}
      title={text}
    >
      {counts.running > 0 ? <span aria-hidden="true" className="lf-enrich-spinner" /> : null}
      {text}
    </span>
  );
}

export default RunProgress;
