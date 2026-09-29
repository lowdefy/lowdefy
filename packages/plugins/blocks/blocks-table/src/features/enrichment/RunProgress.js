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
import resolveTagTone from '@lowdefy/block-utils/format/resolveTagTone.js';

import getProgressMode from './getProgressMode.js';
import getProgressParts from './getProgressParts.js';
import getProgressRoom from './getProgressRoom.js';
import RunIcon from './RunIcon.js';

function StatusIcon({ status }) {
  if (status === 'running') return <span aria-hidden="true" className="lf-enrich-spinner" />;
  return <RunIcon name={status} />;
}

function renderContent({ mode, progress }) {
  if (mode === 'dot') return null;
  if (mode === 'compact') {
    return progress.parts.map((part) => (
      <span className="lf-enrich-progress-part" data-status={part.status} key={part.status}>
        <StatusIcon status={part.status} />
        {part.count}
      </span>
    ));
  }
  return (
    <>
      <StatusIcon status={progress.status} />
      <span className="lf-enrich-progress-text">{progress.text}</span>
    </>
  );
}

// Header part of enrichment and ai columns: the counts of the column's queued, running and
// failed cells, counted over the loaded rows (or read from the server's aggregates in server
// mode; useEnrichment). The chip takes the most severe status' tag tone (error red, running
// blue, queued neutral; tag tones read at 4.5:1 in light and dark themes) and the largest form
// that fits beside the title (getProgressMode): "3 running · 1 queued · 1 error", an icon and a
// count per status, or a dot. The full text is its tooltip and accessible name in every form.
function RunProgress({ api, col, state }) {
  const counts = api.enrichment?.counts.get(col.key);
  if (!counts) return null;
  const progress = getProgressParts(counts);
  if (progress === null) return null;
  const mode = getProgressMode({
    progress,
    measure: api.textMeasure,
    room: getProgressRoom({ api, col, state }),
  });
  const tone = resolveTagTone(progress.tone);
  // The dot is the tone's own colour; the other forms are a tag in that tone.
  const style =
    mode === 'dot'
      ? { background: tone.color }
      : { color: tone.text, background: tone.bg, borderColor: tone.border };
  return (
    <span
      aria-label={progress.text}
      className="lf-enrich-progress"
      data-lf-enrich-progress={mode}
      data-tone={progress.tone}
      role="img"
      style={style}
      title={progress.text}
    >
      {renderContent({ mode, progress })}
    </span>
  );
}

export default RunProgress;
