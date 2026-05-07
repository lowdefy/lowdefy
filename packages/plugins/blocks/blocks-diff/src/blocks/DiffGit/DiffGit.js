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
import { withBlockDefaults } from '@lowdefy/block-utils';

import DiffShell from '../../shared/DiffShell.js';
import GitDiffRenderer from '../../shared/renderers/GitDiffRenderer.js';
import withTheme from '../../shared/withTheme.js';

const DiffGitBlock = ({ blockId, classNames = {}, properties, methods, styles = {} }) => {
  const { before, after, title, emptyText = 'No changes', hide, show } = properties;

  return (
    <DiffShell
      blockId={blockId}
      classNames={classNames}
      styles={styles}
      title={title}
      emptyText={emptyText}
      empty={false}
      methods={methods}
    >
      <GitDiffRenderer
        before={before}
        after={after}
        hide={hide}
        show={show}
        classNames={classNames}
        styles={styles}
      />
    </DiffShell>
  );
};

export default withTheme('Descriptions', withBlockDefaults(DiffGitBlock));
