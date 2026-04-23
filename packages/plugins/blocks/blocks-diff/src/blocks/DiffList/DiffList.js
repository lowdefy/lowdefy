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
import ListRenderer from '../../shared/renderers/ListRenderer.js';
import buildDiffModel from '../../shared/buildDiffModel.js';
import withTheme from '../../shared/withTheme.js';

const DiffListBlock = ({ blockId, classNames = {}, properties, methods, styles = {} }) => {
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
    groupByRoot = true,
    collapseNested = true,
    changeTypeLabels,
    maxDepth = 4,
  } = properties;

  const model = useMemo(
    () =>
      buildDiffModel({
        before,
        after,
        options: { labels, hide, show, format, showUnchanged, groupByRoot, maxDepth },
      }),
    [before, after, labels, hide, show, format, showUnchanged, groupByRoot, maxDepth]
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
      <ListRenderer
        model={model}
        classNames={classNames}
        styles={styles}
        collapseNested={collapseNested}
        changeTypeLabels={changeTypeLabels}
        labels={labels}
      />
    </DiffShell>
  );
};

export default withTheme('Descriptions', withBlockDefaults(DiffListBlock));
