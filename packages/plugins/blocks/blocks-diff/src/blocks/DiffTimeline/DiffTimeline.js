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

import React, { useMemo } from 'react';
import { withBlockDefaults } from '@lowdefy/block-utils';

import DiffShell from '../../shared/DiffShell.js';
import TimelineRenderer from '../../shared/renderers/TimelineRenderer.js';
import buildDiffModel from '../../shared/buildDiffModel.js';
import withTheme from '../../shared/withTheme.js';

const DiffTimelineBlock = ({ blockId, classNames = {}, properties, methods, styles = {} }) => {
  const {
    before,
    after,
    title,
    emptyText = 'No changes',
    labels,
    hide,
    show,
    format,
    showUnchanged = false,
    collapseNested = true,
    changeTypeLabels,
    maxDepth = 4,
  } = properties;

  const model = useMemo(
    () =>
      buildDiffModel({
        before,
        after,
        options: { labels, hide, show, format, showUnchanged, groupByRoot: false, maxDepth },
      }),
    [before, after, labels, hide, show, format, showUnchanged, maxDepth]
  );

  return (
    <DiffShell
      blockId={blockId}
      classNames={classNames}
      styles={styles}
      title={title}
      emptyText={emptyText}
      empty={model.empty}
      methods={methods}
    >
      <TimelineRenderer
        model={model}
        showUnchanged={showUnchanged}
        collapseNested={collapseNested}
        changeTypeLabels={changeTypeLabels}
        classNames={classNames}
        styles={styles}
      />
    </DiffShell>
  );
};

export default withTheme('Timeline', withBlockDefaults(DiffTimelineBlock));
