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

import meta from './meta.js';
import StatusMark from './StatusMark.js';
import useComponentTokens from '../../useComponentTokens.js';

/**
 * A Linear-style glyph by name: a task status (backlog, todo, inProgress, inReview, needsInput,
 * unmerged, readyForRelease, done, cancelled), a priority (priorityUrgent to priorityNone) or a
 * coloured stage `dot`, with an optional label beside it.
 */
function StatusIcon({ blockId, properties, styles }) {
  const { tokens } = useComponentTokens(properties.theme);
  return (
    <StatusMark
      labelStyle={styles.label}
      status={properties}
      style={styles.element}
      testID={`${blockId}_glyph`}
      tokens={tokens}
    />
  );
}

StatusIcon.meta = meta;

export default StatusIcon;
